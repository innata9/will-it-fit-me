import express from 'express';
import cors from 'cors';
import { errorHandler, router } from './routes.js';

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '12mb' }));

// Simple per-IP rate limit: 30 AI requests per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = Number(process.env.RATE_LIMIT ?? 30);
const hits = new Map<string, number[]>();
app.use('/api', (req, res, next) => {
  if (req.method !== 'POST') return next();
  const key = req.ip ?? 'unknown';
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    res.status(429).json({ error: 'Too many checks in a short time. Please wait a few minutes.' });
    return;
  }
  recent.push(now);
  hits.set(key, recent);
  next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, ai: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.use('/api', router);
app.use(errorHandler);

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`Will it fit me? API listening on http://localhost:${port}`);
  if (!process.env.ANTHROPIC_API_KEY) console.warn('ANTHROPIC_API_KEY is not set — AI endpoints will fail.');
});
