import { z } from 'zod';
import { requireDatasetLabToken } from '@/lib/dataset-lab/auth';
import { readClasses, writeClasses } from '@/lib/dataset-lab/classes';
import { asErrorMessage, getParam } from '@/lib/dataset-lab/http';

export const runtime = 'nodejs';

const UpdateClassesSchema = z.object({
  classes: z.array(
    z.object({
      class_id: z.number().int().nonnegative(),
      class_name: z.string().min(1),
    }),
  ),
});

export async function GET(
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
    const classes = await readClasses(safeDataset);
    return Response.json({ classes });
  } catch (error) {
    return Response.json({ error: asErrorMessage(error) }, { status: 400 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ dataset: string }> },
) {
  const authError = requireDatasetLabToken(request);
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json();
    const parsed = UpdateClassesSchema.parse(body);

    const { dataset } = await context.params;
    const safeDataset = getParam({ dataset }, 'dataset');

    await writeClasses(safeDataset, parsed.classes);
    return Response.json({ ok: true, classes: parsed.classes });
  } catch (error) {
    return Response.json({ error: asErrorMessage(error) }, { status: 400 });
  }
}
