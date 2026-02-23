import { readManifest } from '@/lib/dataset-lab/manifest';
import { requireDatasetLabToken } from '@/lib/dataset-lab/auth';
import { asErrorMessage, getParam } from '@/lib/dataset-lab/http';

export const runtime = 'nodejs';

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
    const manifest = await readManifest(safeDataset);
    return Response.json(manifest);
  } catch (error) {
    return Response.json({ error: asErrorMessage(error) }, { status: 400 });
  }
}
