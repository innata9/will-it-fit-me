import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { askStructured, EXTRACT_MODEL, imageBlock, MAIN_MODEL, textBlock, type ContentBlock } from './claude.js';
import { fetchProductPage, FetchError, type ProductPage } from './fetchProduct.js';
import { COLORTYPE_SYSTEM, EXTRACT_SYSTEM, LOOK_SYSTEM, VERDICT_SYSTEM } from './prompts.js';
import {
  ColorTypeResult,
  ExtractedItem,
  LookCheck,
  LookCheckRequest,
  Profile,
  Verdict,
  type Profile as ProfileT,
} from './schemas.js';
import { lengthShiftCm, matchSize } from './sizing.js';

export const router = Router();

const asyncRoute =
  (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const Image = z.object({
  base64: z.string().min(100).max(10_000_000),
  mediaType: z.string().default('image/jpeg'),
});

/* ---------- POST /api/colortype ---------- */
// The selfie is used for this one request and is never stored or logged.

router.post(
  '/colortype',
  asyncRoute(async (req, res) => {
    const { image } = z.object({ image: Image }).parse(req.body);
    const result = await askStructured({
      model: MAIN_MODEL,
      system: COLORTYPE_SYSTEM,
      schema: ColorTypeResult,
      maxTokens: 6000,
      content: [imageBlock(image.base64, image.mediaType), textBlock('Analyse my color type from this selfie.')],
    });
    res.json(result);
  }),
);

/* ---------- POST /api/check ---------- */

const CheckRequest = z
  .object({
    url: z.string().url().optional(),
    screenshot: Image.optional(),
    profile: Profile,
  })
  .refine((v) => v.url || v.screenshot, 'Send a url or a screenshot');

router.post(
  '/check',
  asyncRoute(async (req, res) => {
    const body = CheckRequest.parse(req.body);

    // 1. Extract facts with the lighter model.
    let page: ProductPage | null = null;
    const extractContent: ContentBlock[] = [];
    if (body.url) {
      page = await fetchProductPage(body.url);
      extractContent.push(
        textBlock(
          [
            `URL: ${page.url}`,
            `TITLE: ${page.title}`,
            `META:\n${page.meta}`,
            `JSON-LD:\n${page.jsonLd}`,
            `TABLES:\n${page.tables}`,
            `PAGE TEXT:\n${page.text}`,
          ].join('\n\n'),
        ),
      );
    }
    if (body.screenshot) {
      extractContent.push(imageBlock(body.screenshot.base64, body.screenshot.mediaType));
      extractContent.push(textBlock('This is a screenshot of the product page (or its size chart).'));
    }

    const item = await askStructured({
      model: EXTRACT_MODEL,
      system: EXTRACT_SYSTEM,
      schema: ExtractedItem,
      content: extractContent,
    });

    if (!item.found) {
      res.status(422).json({ error: 'We couldn’t find a single clothing item on this page. Try the product page itself.' });
      return;
    }

    // 2. Compute size and length with code, not the model.
    const m = body.profile.measurements;
    const sizeMatch = item.sizeChart && item.sizeChart.kind === 'body' ? matchSize(item.sizeChart, m, item.stretch) : null;
    const lengthShift = lengthShiftCm(item.modelHeightCm, m.heightCm);
    const brandHistory = body.profile.fitHistory.filter(
      (h) => item.brand && h.brand.toLowerCase() === item.brand.toLowerCase(),
    );

    // 3. Verdict with the main model.
    const verdictContent: ContentBlock[] = [];
    if (page?.imageUrl) verdictContent.push({ type: 'image', source: { type: 'url', url: page.imageUrl } });
    if (body.screenshot) verdictContent.push(imageBlock(body.screenshot.base64, body.screenshot.mediaType));
    verdictContent.push(
      textBlock(
        JSON.stringify(
          {
            profile: publicProfile(body.profile),
            item,
            computedSizeMatch: sizeMatch,
            computedLengthShiftCm: lengthShift,
            lengthShiftMeaning:
              lengthShift == null ? null : 'Positive = the hem lands this many cm lower on the user than on the model.',
            fitHistoryWithThisBrand: brandHistory,
          },
          null,
          1,
        ),
      ),
    );

    let verdict: Verdict;
    try {
      verdict = await askStructured({ model: MAIN_MODEL, system: VERDICT_SYSTEM, schema: Verdict, content: verdictContent });
    } catch (err) {
      // The shop's image may not be reachable by the API — retry without it.
      if (!page?.imageUrl) throw err;
      verdict = await askStructured({
        model: MAIN_MODEL,
        system: VERDICT_SYSTEM,
        schema: Verdict,
        content: verdictContent.filter((b) => b.type !== 'image' || body.screenshot),
      });
    }

    res.json({ item: { ...item, url: page?.url ?? body.url ?? null, imageUrl: page?.imageUrl ?? null }, sizeMatch, verdict });
  }),
);

/* ---------- POST /api/look-check ---------- */

router.post(
  '/look-check',
  asyncRoute(async (req, res) => {
    const body = LookCheckRequest.parse(req.body);
    const result: LookCheck = await askStructured({
      model: MAIN_MODEL,
      system: LOOK_SYSTEM,
      schema: LookCheck,
      maxTokens: 1500,
      content: [
        textBlock(JSON.stringify({ occasion: body.occasion, pieces: body.pieces, profile: publicProfile(body.profile) })),
      ],
    });
    res.json(result);
  }),
);

/* ---------- POST /api/avatar ---------- */
// Photo-realistic try-on renders need an image-generation provider. The app falls back
// to its built-in illustrated avatar until one is configured. Rule for any provider:
// the person is always clothed — the chosen outfit or a neutral base layer, never nude.

router.post('/avatar', (_req, res) => {
  res.status(501).json({ error: 'Photo-realistic rendering is not configured yet.' });
});

/** Only what the model needs — no names, emails or photos. */
function publicProfile(p: ProfileT) {
  return {
    measurementsCm: p.measurements,
    bodyShape: p.bodyShape,
    heightCategory: p.heightCategory,
    notes: p.notes,
    fitPreference: p.fitPreference,
    colorType: p.colorType,
  };
}

/* ---------- Errors ---------- */

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof z.ZodError) {
    res.status(400).json({ error: 'Invalid request', details: err.issues.slice(0, 5) });
    return;
  }
  if (err instanceof FetchError) {
    res.status(422).json({ error: err.userMessage });
    return;
  }
  // Never log request bodies: they contain measurements and photos.
  console.error('[error]', err instanceof Error ? err.message : err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
}
