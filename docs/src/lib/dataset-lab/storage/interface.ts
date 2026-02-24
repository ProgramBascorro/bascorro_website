import type { SaveImageResult } from '../types';

export interface ImageStorage {
  saveImage(
    dataset: string,
    session: string,
    file: Buffer,
    ext: string,
    preferredId?: string,
  ): Promise<SaveImageResult>;
  getImagePath(dataset: string, session: string, id: string): Promise<string>;
}
