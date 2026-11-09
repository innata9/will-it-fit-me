import type { CheckResponse, ColorTypeResult, LookCheck, Measurements, Piece } from '../types';

/**
 * The API server (see /server). On a phone, localhost is the phone itself —
 * set EXPO_PUBLIC_API_URL to your computer's LAN address, e.g. http://192.168.1.20:8787
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787').replace(/\/$/, '');

export interface ApiProfile {
  measurements: Measurements;
  bodyShape?: string;
  heightCategory?: string;
  notes: string[];
  fitPreference?: string;
  colorType?: {
    season: string;
    undertone: string;
    contrast: string;
    best: { name: string; hex: string }[];
    avoid: { name: string; hex: string }[];
  };
  fitHistory: { brand: string; item: string; size: string; note: string }[];
}

export class ApiError extends Error {}

async function post<T>(path: string, body: unknown, timeoutMs = 90_000): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new ApiError('Can’t reach the server. Check your connection and try again.');
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(data.error ?? `Something went wrong (${res.status}).`);
  return data as T;
}

export const api = {
  colorType: (image: { base64: string; mediaType: string }) => post<ColorTypeResult>('/api/colortype', { image }),
  check: (input: { url?: string; screenshot?: { base64: string; mediaType: string }; profile: ApiProfile }) =>
    post<CheckResponse>('/api/check', input, 120_000),
  lookCheck: (input: { pieces: Piece[]; occasion: string; profile: ApiProfile }) =>
    post<LookCheck>('/api/look-check', input),
};
