import { describe, expect, it } from 'vitest';
import { normalizeXyxy, xyxyToYolo, yoloToXyxy } from '../coords';

describe('bbox coords', () => {
  it('normalizes and clamps xyxy', () => {
    const result = normalizeXyxy([120, 90, -10, 650], 640, 480);
    expect(result).toEqual([0, 90, 120, 480]);
  });

  it('converts xyxy -> yolo -> xyxy near-equal', () => {
    const xyxy: [number, number, number, number] = [50, 40, 250, 140];
    const yolo = xyxyToYolo(xyxy, 640, 480);
    const roundtrip = yoloToXyxy(yolo, 640, 480);

    expect(roundtrip[0]).toBeCloseTo(xyxy[0], 4);
    expect(roundtrip[1]).toBeCloseTo(xyxy[1], 4);
    expect(roundtrip[2]).toBeCloseTo(xyxy[2], 4);
    expect(roundtrip[3]).toBeCloseTo(xyxy[3], 4);
  });
});
