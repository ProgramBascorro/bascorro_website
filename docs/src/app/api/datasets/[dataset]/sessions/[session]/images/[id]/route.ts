import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { LocalDiskStorage } from '@/lib/dataset-lab/storage/local-disk';
import { requireDatasetLabToken } from '@/lib/dataset-lab/auth';
import { asErrorMessage, getParam } from '@/lib/dataset-lab/http';

export const runtime = 'nodejs';

const storage = new LocalDiskStorage();

function mimeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ dataset: string; session: string; id: string }> },
) {
  const authError = requireDatasetLabToken(request);
  if (authError) {
    return authError;
  }

  try {
    const { dataset, session, id } = await context.params;
    const safeDataset = getParam({ dataset }, 'dataset');
    const safeSession = getParam({ session }, 'session');
    const safeId = getParam({ id }, 'id');

    const imagePath = await storage.getImagePath(safeDataset, safeSession, safeId);
    const image = await readFile(imagePath);
    const contentType = mimeFromExt(path.extname(imagePath));

    return new Response(image, {
      headers: {
        'content-type': contentType,
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    return Response.json({ error: asErrorMessage(error) }, { status: 404 });
  }
}
