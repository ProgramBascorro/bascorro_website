import type { ImageStorage } from './interface';
import type { SaveImageResult } from '../types';

// TODO: Implement Cloudflare R2-backed storage without changing API route logic.
// Keep the ImageStorage interface stable so LocalDiskStorage and R2Storage are swappable.
export class R2Storage implements ImageStorage {
  async saveImage(
    _dataset: string,
    _session: string,
    _file: Buffer,
    _ext: string,
    _preferredId?: string,
  ): Promise<SaveImageResult> {
    throw new Error('R2Storage is not implemented yet.');
  }

  async getImagePath(_dataset: string, _session: string, _id: string): Promise<string> {
    throw new Error('R2Storage is not implemented yet.');
  }
}
