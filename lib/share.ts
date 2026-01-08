import type { DatasetVariant } from './types';

const APP_VERSION = '1';

const encodeBase64 = (input: string) => {
  if (typeof window === 'undefined') {
    return Buffer.from(input, 'utf8').toString('base64');
  }
  return btoa(unescape(encodeURIComponent(input)));
};

const decodeBase64 = (input: string) => {
  if (typeof window === 'undefined') {
    return Buffer.from(input, 'base64').toString('utf8');
  }
  return decodeURIComponent(escape(atob(input)));
};

const base64UrlEncode = (input: string) =>
  encodeBase64(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const base64UrlDecode = (input: string) => {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  return decodeBase64(`${padded}${'='.repeat(padLength)}`);
};

const crc32 = (value: string) => {
  let crc = 0 ^ -1;
  for (let i = 0; i < value.length; i += 1) {
    let code = value.charCodeAt(i);
    for (let j = 0; j < 8; j += 1) {
      const mix = (crc ^ code) & 1;
      crc = (crc >>> 1) ^ (mix ? 0xedb88320 : 0);
      code >>>= 1;
    }
  }
  return (crc ^ -1) >>> 0;
};

export type ShareTokenPayload = {
  v: string;
  variant: DatasetVariant;
  seed: string;
  count: number;
  accuracy: number;
  durationMs: number;
  composite: number;
  createdAt: string;
};

export const encodeShareToken = (payload: ShareTokenPayload) => {
  const body = JSON.stringify(payload);
  const checksum = crc32(body).toString(16).padStart(8, '0');
  return base64UrlEncode(JSON.stringify({ body, checksum }));
};

export const decodeShareToken = (token: string) => {
  try {
    const decoded = base64UrlDecode(token);
    const parsed = JSON.parse(decoded) as { body: string; checksum: string };
    if (!parsed?.body || !parsed?.checksum) {
      return null;
    }
    const checksum = crc32(parsed.body).toString(16).padStart(8, '0');
    if (checksum !== parsed.checksum) {
      return null;
    }
    const payload = JSON.parse(parsed.body) as ShareTokenPayload;
    if (payload.v !== APP_VERSION) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
};

export const makeSharePayload = (
  variant: DatasetVariant,
  seed: string,
  count: number,
  accuracy: number,
  durationMs: number,
  composite: number
): ShareTokenPayload => ({
  v: APP_VERSION,
  variant,
  seed,
  count,
  accuracy,
  durationMs,
  composite,
  createdAt: new Date().toISOString()
});
