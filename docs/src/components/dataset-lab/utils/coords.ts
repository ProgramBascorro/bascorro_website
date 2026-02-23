import { normalizeXyxy } from '@/lib/dataset-lab/coords';

export function formatBox(bbox: [number, number, number, number]): string {
  const [x1, y1, x2, y2] = bbox.map((n) => Math.round(n));
  return `${x1},${y1} → ${x2},${y2}`;
}

export function normalizeBoxForImage(
  bbox: [number, number, number, number],
  width: number,
  height: number,
): [number, number, number, number] {
  return normalizeXyxy(bbox, width, height);
}
