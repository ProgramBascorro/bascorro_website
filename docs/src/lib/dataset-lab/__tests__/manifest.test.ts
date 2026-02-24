import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { nextImageId, readManifest, upsertManifestItems, writeManifest } from '../manifest';

describe('manifest io', () => {
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'dataset-lab-manifest-'));
    process.env.DATASET_LAB_DATA_DIR = tempDir;
  });

  afterEach(async () => {
    delete process.env.DATASET_LAB_DATA_DIR;
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('creates and reads manifest', async () => {
    const manifest = await readManifest('soccer_v1');
    expect(manifest.dataset).toBe('soccer_v1');
    expect(manifest.items).toEqual([]);
  });

  it('upserts items and computes next id', async () => {
    const manifest = await readManifest('soccer_v1');
    const next = upsertManifestItems(manifest, [
      {
        id: 'img_000001',
        session: 'session_1',
        rel_path: 'images/session_1/img_000001.jpg',
        sha256: 'abc',
        width: 640,
        height: 480,
        created_at: new Date().toISOString(),
      },
    ]);

    await writeManifest('soccer_v1', next);
    const loaded = await readManifest('soccer_v1');

    expect(loaded.items).toHaveLength(1);
    expect(nextImageId(loaded)).toBe('img_000002');
  });
});
