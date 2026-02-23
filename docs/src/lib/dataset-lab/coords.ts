export interface YoloBox {
  classId: number;
  xCenter: number;
  yCenter: number;
  width: number;
  height: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizeXyxy(
  bbox: [number, number, number, number],
  imageWidth: number,
  imageHeight: number,
): [number, number, number, number] {
  const x1 = clamp(Math.min(bbox[0], bbox[2]), 0, imageWidth);
  const y1 = clamp(Math.min(bbox[1], bbox[3]), 0, imageHeight);
  const x2 = clamp(Math.max(bbox[0], bbox[2]), 0, imageWidth);
  const y2 = clamp(Math.max(bbox[1], bbox[3]), 0, imageHeight);
  return [x1, y1, x2, y2];
}

export function xyxyToYolo(
  bbox: [number, number, number, number],
  imageWidth: number,
  imageHeight: number,
): [number, number, number, number] {
  const [x1, y1, x2, y2] = normalizeXyxy(bbox, imageWidth, imageHeight);
  const w = x2 - x1;
  const h = y2 - y1;
  const cx = x1 + w / 2;
  const cy = y1 + h / 2;

  return [cx / imageWidth, cy / imageHeight, w / imageWidth, h / imageHeight];
}

export function yoloToXyxy(
  bbox: [number, number, number, number],
  imageWidth: number,
  imageHeight: number,
): [number, number, number, number] {
  const [cxN, cyN, wN, hN] = bbox;
  const cx = cxN * imageWidth;
  const cy = cyN * imageHeight;
  const w = wN * imageWidth;
  const h = hN * imageHeight;

  const x1 = cx - w / 2;
  const y1 = cy - h / 2;
  const x2 = cx + w / 2;
  const y2 = cy + h / 2;

  return normalizeXyxy([x1, y1, x2, y2], imageWidth, imageHeight);
}

export function isSmallBox(
  bbox: [number, number, number, number],
  minSizePx = 2,
): boolean {
  const w = Math.abs(bbox[2] - bbox[0]);
  const h = Math.abs(bbox[3] - bbox[1]);
  return w < minSizePx || h < minSizePx;
}
