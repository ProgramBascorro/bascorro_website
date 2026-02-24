import { z } from 'zod';
import { requireDatasetLabToken } from '@/lib/dataset-lab/auth';
import { asErrorMessage, getParam } from '@/lib/dataset-lab/http';
import { readManifest } from '@/lib/dataset-lab/manifest';
import { computeSplits, writeSplits } from '@/lib/dataset-lab/splits';

export const runtime = 'nodejs';

const SplitsBodySchema = z.object({
  seed: z.number().int().optional(),
  ratios: z
    .object({
      train: z.number().nonnegative(),
      val: z.number().nonnegative(),
      test: z.number().nonnegative(),
    })
    .optional(),
  train: z.number().nonnegative().optional(),
  val: z.number().nonnegative().optional(),
  test: z.number().nonnegative().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ dataset: string }> },
) {
  const authError = requireDatasetLabToken(request);
  if (authError) {
    return authError;
  }

  try {
    const { dataset } = await context.params;
    const safeDataset = getParam({ dataset }, 'dataset');

    const payload = SplitsBodySchema.parse(await request.json());
    const ratios = payload.ratios ?? {
      train: payload.train ?? 0.7,
      val: payload.val ?? 0.2,
      test: payload.test ?? 0.1,
    };

    const manifest = await readManifest(safeDataset);
    const split = computeSplits(manifest, ratios, payload.seed ?? 42);
    await writeSplits(safeDataset, split);

    return Response.json({ ok: true, split, total: manifest.items.length });
  } catch (error) {
    return Response.json({ error: asErrorMessage(error) }, { status: 400 });
  }
}
