import { readFile, writeFile } from 'node:fs/promises';
import type { DatasetManifest, ManifestItem } from './types';
import { datasetManifestPath, ensureDatasetDirs } from './paths';

function createEmptyManifest(dataset: string): DatasetManifest {
  return {
    dataset,
    created_at: new Date().toISOString(),
    items: [],
  };
}

export async function readManifest(dataset: string): Promise<DatasetManifest> {
  await ensureDatasetDirs(dataset);
  const file = datasetManifestPath(dataset);

  try {
    const raw = await readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as DatasetManifest;
    if (!parsed.dataset || !Array.isArray(parsed.items)) {
      throw new Error('Invalid manifest format.');
    }
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
    const manifest = createEmptyManifest(dataset);
    await writeManifest(dataset, manifest);
    return manifest;
  }
}

export async function writeManifest(
  dataset: string,
  manifest: DatasetManifest,
): Promise<void> {
  await ensureDatasetDirs(dataset);
  const file = datasetManifestPath(dataset);
  await writeFile(file, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

export function nextImageId(manifest: DatasetManifest): string {
  let max = 0;
  for (const item of manifest.items) {
    const match = /^img_(\d+)$/.exec(item.id);
    if (!match) {
      continue;
    }
    max = Math.max(max, Number.parseInt(match[1], 10));
  }
  return `img_${String(max + 1).padStart(6, '0')}`;
}

export function upsertManifestItems(
  manifest: DatasetManifest,
  items: ManifestItem[],
): DatasetManifest {
  const map = new Map<string, ManifestItem>();
  for (const item of manifest.items) {
    map.set(item.id, item);
  }
  for (const item of items) {
    map.set(item.id, item);
  }

  return {
    ...manifest,
    items: [...map.values()].sort((a, b) => a.id.localeCompare(b.id)),
  };
}

export function findManifestItem(
  manifest: DatasetManifest,
  session: string,
  id: string,
): ManifestItem | null {
  return (
    manifest.items.find((item) => item.id === id && item.session === session) ?? null
  );
}
