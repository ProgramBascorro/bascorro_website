import path from 'node:path';
import { readdir, writeFile } from 'node:fs/promises';
import type { ImageStorage } from './interface';
import type { SaveImageResult } from '../types';
import { detectImageMeta, getSha256 } from '../image';
import { ensureSessionDirs, sanitizeSegment, sessionImagesDir } from '../paths';

function makeId(): string {
  return `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export class LocalDiskStorage implements ImageStorage {
  async saveImage(
    dataset: string,
    session: string,
    file: Buffer,
    ext: string,
    preferredId?: string,
  ): Promise<SaveImageResult> {
    const id = preferredId ?? makeId();
    const safeId = sanitizeSegment(id, 'id');
    const safeExt = ext.toLowerCase();

    await ensureSessionDirs(dataset, session);

    const dir = sessionImagesDir(dataset, session);
    const absPath = path.join(dir, `${safeId}.${safeExt}`);

    const { width, height } = detectImageMeta(file);
    const sha256 = getSha256(file);
    const createdAt = new Date().toISOString();

    await writeFile(absPath, file);

    return {
      id: safeId,
      path: absPath,
      relPath: path.posix.join('images', session, `${safeId}.${safeExt}`),
      width,
      height,
      sha256,
      createdAt,
    };
  }

  async getImagePath(dataset: string, session: string, id: string): Promise<string> {
    const safeId = sanitizeSegment(id, 'id');
    const dir = sessionImagesDir(dataset, session);
    const files = await readdir(dir);
    const match = files.find((name) => name.startsWith(`${safeId}.`));
    if (!match) {
      throw new Error(`Image ${safeId} not found.`);
    }
    return path.join(dir, match);
  }
}
