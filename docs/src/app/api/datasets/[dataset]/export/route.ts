import { requireDatasetLabToken } from '@/lib/dataset-lab/auth';
import { createDatasetExportZip } from '@/lib/dataset-lab/export';
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
    const zip = await createDatasetExportZip(safeDataset);

    return new Response(new Uint8Array(zip), {
      headers: {
        'content-type': 'application/zip',
        'content-disposition': `attachment; filename="${safeDataset}_labels_export.zip"`,
      },
    });
  } catch (error) {
    return Response.json({ error: asErrorMessage(error) }, { status: 400 });
  }
}
