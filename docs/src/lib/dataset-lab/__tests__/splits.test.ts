import { describe, expect, it } from 'vitest';
import { computeSplits } from '../splits';

const manifest = {
  dataset: 'soccer_v1',
  created_at: new Date().toISOString(),
  items: Array.from({ length: 10 }).map((_, i) => ({
    id: `img_${String(i + 1).padStart(6, '0')}`,
    session: 's1',
    rel_path: `images/s1/img_${String(i + 1).padStart(6, '0')}.jpg`,
    sha256: String(i),
    width: 640,
    height: 480,
    created_at: new Date().toISOString(),
  })),
};

describe('split generation', () => {
  it('is deterministic with fixed seed', () => {
    const a = computeSplits(manifest, { train: 0.7, val: 0.2, test: 0.1 }, 42);
    const b = computeSplits(manifest, { train: 0.7, val: 0.2, test: 0.1 }, 42);

    expect(a).toEqual(b);
    expect(a.train.length + a.val.length + a.test.length).toBe(10);
  });
});
