import { createHash } from 'node:crypto';
import { imageSize } from 'image-size';

export function getSha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export function detectImageMeta(buffer: Buffer): { width: number; height: number } {
  const meta = imageSize(buffer);
  if (!meta.width || !meta.height) {
    throw new Error('Unable to read image dimensions.');
  }
  return { width: meta.width, height: meta.height };
}

export function normalizeImageExtension(filename: string): 'jpg' | 'jpeg' | 'png' {
  const dot = filename.lastIndexOf('.');
  const ext = dot >= 0 ? filename.slice(dot + 1).toLowerCase() : '';
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
    return ext;
  }
  throw new Error(`Unsupported image extension: ${ext || 'unknown'}.`);
}

export function normalizeMimeType(mimeType: string): boolean {
  return mimeType === 'image/jpeg' || mimeType === 'image/png';
}
