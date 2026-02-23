import { describe, expect, it, vi, afterEach } from 'vitest';
import { suggestWithGemini } from '../assist/gemini';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('gemini parser safety', () => {
  it('returns warnings and empty annotations for invalid output', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'not json at all' }],
              },
            },
          ],
        }),
      })),
    );

    const result = await suggestWithGemini({
      apiKey: 'x',
      imageBuffer: Buffer.from('abc'),
      imageMimeType: 'image/jpeg',
      classes: [{ class_id: 0, class_name: 'ball' }],
      imageWidth: 640,
      imageHeight: 480,
    });

    expect(result.annotations).toEqual([]);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
