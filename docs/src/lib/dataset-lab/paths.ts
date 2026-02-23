import path from 'node:path';
import { mkdir } from 'node:fs/promises';

const SAFE_SEGMENT = /^[a-zA-Z0-9_-]+$/;

export function getDataRoot(): string {
  const configured = process.env.DATASET_LAB_DATA_DIR;
  if (configured && configured.trim().length > 0) {
    return path.resolve(configured);
  }
  return path.join(process.cwd(), 'data');
}

export function sanitizeSegment(value: string, fieldName: string): string {
  if (!value || !SAFE_SEGMENT.test(value)) {
    throw new Error(`Invalid ${fieldName}. Use only letters, numbers, '_' or '-'.`);
  }
  return value;
}

export function datasetDir(dataset: string): string {
  return path.join(getDataRoot(), sanitizeSegment(dataset, 'dataset'));
}

export function datasetImagesDir(dataset: string): string {
  return path.join(datasetDir(dataset), 'images');
}

export function datasetLabelsDir(dataset: string): string {
  return path.join(datasetDir(dataset), 'labels');
}

export function datasetLabelsJsonDir(dataset: string): string {
  return path.join(datasetDir(dataset), 'labels_json');
}

export function datasetSplitsDir(dataset: string): string {
  return path.join(datasetDir(dataset), 'splits');
}

export function datasetManifestPath(dataset: string): string {
  return path.join(datasetDir(dataset), 'manifest.json');
}

export function datasetClassesPath(dataset: string): string {
  return path.join(datasetDir(dataset), 'classes.yaml');
}

export function sessionImagesDir(dataset: string, session: string): string {
  return path.join(
    datasetImagesDir(dataset),
    sanitizeSegment(session, 'session'),
  );
}

export function sessionLabelsDir(dataset: string, session: string): string {
  return path.join(
    datasetLabelsDir(dataset),
    sanitizeSegment(session, 'session'),
  );
}

export function sessionLabelsJsonDir(dataset: string, session: string): string {
  return path.join(
    datasetLabelsJsonDir(dataset),
    sanitizeSegment(session, 'session'),
  );
}

export function imageFilePath(
  dataset: string,
  session: string,
  id: string,
  ext: string,
): string {
  return path.join(
    sessionImagesDir(dataset, session),
    `${sanitizeSegment(id, 'id')}.${ext}`,
  );
}

export function labelFilePath(dataset: string, session: string, id: string): string {
  return path.join(sessionLabelsDir(dataset, session), `${sanitizeSegment(id, 'id')}.txt`);
}

export function labelJsonFilePath(
  dataset: string,
  session: string,
  id: string,
): string {
  return path.join(
    sessionLabelsJsonDir(dataset, session),
    `${sanitizeSegment(id, 'id')}.json`,
  );
}

export function splitFilePath(
  dataset: string,
  split: 'train' | 'val' | 'test',
): string {
  return path.join(datasetSplitsDir(dataset), `${split}.txt`);
}

export async function ensureDatasetDirs(dataset: string): Promise<void> {
  await mkdir(datasetDir(dataset), { recursive: true });
  await mkdir(datasetImagesDir(dataset), { recursive: true });
  await mkdir(datasetLabelsDir(dataset), { recursive: true });
  await mkdir(datasetLabelsJsonDir(dataset), { recursive: true });
  await mkdir(datasetSplitsDir(dataset), { recursive: true });
}

export async function ensureSessionDirs(
  dataset: string,
  session: string,
): Promise<void> {
  await ensureDatasetDirs(dataset);
  await mkdir(sessionImagesDir(dataset, session), { recursive: true });
  await mkdir(sessionLabelsDir(dataset, session), { recursive: true });
  await mkdir(sessionLabelsJsonDir(dataset, session), { recursive: true });
}
