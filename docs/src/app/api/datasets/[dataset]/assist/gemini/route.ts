import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { requireDatasetLabToken } from '@/lib/dataset-lab/auth';
import { suggestWithGemini } from '@/lib/dataset-lab/assist/gemini';
import { readClasses } from '@/lib/dataset-lab/classes';
import { asErrorMessage, getParam } from '@/lib/dataset-lab/http';
import { findManifestItem, readManifest } from '@/lib/dataset-lab/manifest';
import { LocalDiskStorage } from '@/lib/dataset-lab/storage/local-disk';

export const runtime = 'nodejs';

const storage = new LocalDiskStorage();

const AssistBodySchema = z.object({
  session: z.string().min(1),
  id: z.string().min(1),
});

function mimeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') {
    return 'image/png';
  }
  return 'image/jpeg';
}

export async function GET(request: Request) {
  const authError = requireDatasetLabToken(request);
  if (authError) {
    return authError;
  }

  return Response.json({ enabled: Boolean(process.env.GEMINI_API_KEY) });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ dataset: string }> },
) {
  const authError = requireDatasetLabToken(request);
  if (authError) {
    return authError;
  }

  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      {
        error:
          'Gemini assist is disabled. Set GEMINI_API_KEY to enable suggestions.',
      },
      { status: 501 },
    );
  }

  try {
    const { dataset } = await context.params;
    const safeDataset = getParam({ dataset }, 'dataset');
    const body = AssistBodySchema.parse(await request.json());
    const safeSession = getParam({ session: body.session }, 'session');
    const safeId = getParam({ id: body.id }, 'id');

    const manifest = await readManifest(safeDataset);
    const item = findManifestItem(manifest, safeSession, safeId);
    if (!item) {
      return Response.json({ error: 'Image not found in manifest.' }, { status: 404 });
    }

    const imagePath = await storage.getImagePath(safeDataset, safeSession, safeId);
    const imageBuffer = await readFile(imagePath);
    const classes = await readClasses(safeDataset);

    const result = await suggestWithGemini({
      apiKey: process.env.GEMINI_API_KEY,
      imageBuffer,
      imageMimeType: mimeFromPath(imagePath),
      classes,
      imageWidth: item.width,
      imageHeight: item.height,
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: asErrorMessage(error) }, { status: 400 });
  }
}
