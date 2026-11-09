import { lookup } from 'node:dns/promises';
import net from 'node:net';
import * as cheerio from 'cheerio';

const MAX_BYTES = 3 * 1024 * 1024;
const TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 4;
const MAX_TEXT = 30_000;

export class FetchError extends Error {
  constructor(message: string, public readonly userMessage: string) {
    super(message);
  }
}

export interface ProductPage {
  url: string;
  title: string;
  imageUrl: string | null;
  jsonLd: string;
  meta: string;
  tables: string;
  text: string;
}

/** Fetch a public product page safely (no internal addresses, size and time limits). */
export async function fetchProductPage(rawUrl: string): Promise<ProductPage> {
  let url = parsePublicUrl(rawUrl);
  let res: Response | null = null;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url.hostname);
    res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; WillItFitMe/1.0; product fit check)',
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'en,uk;q=0.9,pl;q=0.8',
      },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = parsePublicUrl(new URL(res.headers.get('location')!, url).toString());
      continue;
    }
    break;
  }

  if (!res || res.status >= 400) {
    throw new FetchError(`HTTP ${res?.status}`, 'The shop did not let us read this page. Send a screenshot instead.');
  }
  const type = res.headers.get('content-type') ?? '';
  if (!type.includes('html')) {
    throw new FetchError(`content-type ${type}`, 'This link is not a product page.');
  }

  const html = await readLimited(res);
  return extract(url.toString(), html);
}

function parsePublicUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new FetchError('bad url', 'That doesn’t look like a link. Copy the product link from the shop.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new FetchError('bad protocol', 'Only web links (https://…) can be checked.');
  }
  if (url.username || url.password) throw new FetchError('credentials in url', 'That link can’t be checked.');
  return url;
}

async function assertPublicHost(hostname: string) {
  const host = hostname.replace(/^\[|\]$/g, '');
  const addresses = net.isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address);
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new FetchError(`blocked host ${hostname}`, 'That link can’t be checked.');
  }
}

export function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith('::ffff:')) return isPrivateAddress(v6.slice(7));
  return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80');
}

async function readLimited(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function extract(url: string, html: string): ProductPage {
  const $ = cheerio.load(html);

  const jsonLd = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => /product|offer|sku/i.test(t))
    .join('\n')
    .slice(0, 12_000);

  const metaPairs: string[] = [];
  $('meta[property^="og:"], meta[property^="product:"], meta[name="description"]').each((_, el) => {
    const key = $(el).attr('property') ?? $(el).attr('name');
    const val = $(el).attr('content');
    if (key && val) metaPairs.push(`${key}: ${val}`);
  });

  const imageUrl = $('meta[property="og:image"]').attr('content') ?? null;

  const tables = $('table')
    .map((_, t) =>
      $(t)
        .find('tr')
        .map((__, tr) =>
          $(tr)
            .find('th,td')
            .map((___, c) => $(c).text().replace(/\s+/g, ' ').trim())
            .get()
            .join(' | '),
        )
        .get()
        .join('\n'),
    )
    .get()
    .filter((t) => /\d/.test(t))
    .join('\n\n')
    .slice(0, 10_000);

  $('script, style, noscript, svg, header nav, footer').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);

  return {
    url,
    title: $('title').first().text().trim(),
    imageUrl: imageUrl && /^https:\/\//.test(imageUrl) ? imageUrl : null,
    jsonLd,
    meta: metaPairs.join('\n'),
    tables,
    text,
  };
}
