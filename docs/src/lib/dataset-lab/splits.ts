import { writeFile } from 'node:fs/promises';
import type { DatasetManifest, SplitRatios, SplitResult } from './types';
import { ensureDatasetDirs, splitFilePath } from './paths';

function makeSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function validateRatios(ratios: SplitRatios): SplitRatios {
  const train = Number(ratios.train);
  const val = Number(ratios.val);
  const test = Number(ratios.test);

  if (train < 0 || val < 0 || test < 0) {
    throw new Error('Split ratios must be non-negative.');
  }

  const sum = train + val + test;
  if (sum <= 0) {
    throw new Error('Split ratios sum must be greater than zero.');
  }

  return {
    train: train / sum,
    val: val / sum,
    test: test / sum,
  };
}

export function computeSplits(
  manifest: DatasetManifest,
  ratios: SplitRatios,
  seed = 42,
): SplitResult {
  const normalized = validateRatios(ratios);
  const rng = makeSeededRng(seed);

  const items = [...manifest.items];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  const total = items.length;
  const trainCount = Math.floor(total * normalized.train);
  const valCount = Math.floor(total * normalized.val);
  const train = items.slice(0, trainCount).map((item) => item.rel_path);
  const val = items
    .slice(trainCount, trainCount + valCount)
    .map((item) => item.rel_path);
  const test = items.slice(trainCount + valCount).map((item) => item.rel_path);

  return { train, val, test };
}

export async function writeSplits(
  dataset: string,
  split: SplitResult,
): Promise<void> {
  await ensureDatasetDirs(dataset);

  await writeFile(splitFilePath(dataset, 'train'), `${split.train.join('\n')}\n`, 'utf8');
  await writeFile(splitFilePath(dataset, 'val'), `${split.val.join('\n')}\n`, 'utf8');
  await writeFile(splitFilePath(dataset, 'test'), `${split.test.join('\n')}\n`, 'utf8');
}
