import { z } from 'zod';
import { LocalDiskStorage } from '@/lib/dataset-lab/storage/local-disk';
import { requireDatasetLabToken, getTokenFromRequest } from '@/lib/dataset-lab/auth';
import { asErrorMessage, getParam } from '@/lib/dataset-lab/http';
import { normalizeImageExtension, normalizeMimeType } from '@/lib/dataset-lab/image';
import {
  nextImageId,
  readManifest,
  upsertManifestItems,
  writeManifest,
} from '@/lib/dataset-lab/manifest';
import type { ManifestItem } from '@/lib/dataset-lab/types';

export const runtime = 'nodejs';

const QuerySchema = z.object({
  dataset: z.string(),
  session: z.string(),
});

const storage = new LocalDiskStorage();

function buildImageUrl(
  request: Request,
  dataset: string,
  session: string,
  id: string,
): string {
  const token = getTokenFromRequest(request);
  const base = `/api/datasets/${dataset}/sessions/${session}/images/${id}`;
  if (!token) {
    return base;
  }
  return `${base}?token=${encodeURIComponent(token)}`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ dataset: string; session: string }> },
) {
  const authError = requireDatasetLabToken(request);
  if (authError) {
    return authError;
  }

  try {
    const route = await context.params;
    const { dataset, session } = QuerySchema.parse(route);
    const safeDataset = getParam({ dataset }, 'dataset');
    const safeSession = getParam({ session }, 'session');

    const manifest = await readManifest(safeDataset);
    const images = manifest.items
      .filter((item) => item.session === safeSession)
      .map((item) => {
        const url = buildImageUrl(request, safeDataset, safeSession, item.id);
        return {
          ...item,
          imageUrl: url,
          thumbnailUrl: url,
        };
      });

    return Response.json({ images });
  } catch (error) {
    return Response.json({ error: asErrorMessage(error) }, { status: 400 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ dataset: string; session: string }> },
) {
  const authError = requireDatasetLabToken(request);
  if (authError) {
    return authError;
  }

  try {
    const route = await context.params;
    const { dataset, session } = QuerySchema.parse(route);
    const safeDataset = getParam({ dataset }, 'dataset');
    const safeSession = getParam({ session }, 'session');

    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files.length) {
      return Response.json(
        { error: 'No files uploaded. Use multipart field "files".' },
        { status: 400 },
      );
    }

    let manifest = await readManifest(safeDataset);
    const createdItems: ManifestItem[] = [];

    for (const value of files) {
      if (!(value instanceof File)) {
        continue;
      }
      if (!normalizeMimeType(value.type)) {
        return Response.json(
          { error: `Unsupported mime type: ${value.type}` },
          { status: 400 },
        );
      }

      const ext = normalizeImageExtension(value.name);
      const buffer = Buffer.from(await value.arrayBuffer());
      const id = nextImageId(manifest);

      const stored = await storage.saveImage(
        safeDataset,
        safeSession,
        buffer,
        ext,
        id,
      );

      const item: ManifestItem = {
        id: stored.id,
        session: safeSession,
        rel_path: stored.relPath,
        sha256: stored.sha256,
        width: stored.width,
        height: stored.height,
        created_at: stored.createdAt,
      };

      manifest = upsertManifestItems(manifest, [item]);
      createdItems.push(item);
    }

    await writeManifest(safeDataset, manifest);

    const created = createdItems.map((item) => ({
      ...item,
      imageUrl: buildImageUrl(request, safeDataset, safeSession, item.id),
      thumbnailUrl: buildImageUrl(request, safeDataset, safeSession, item.id),
    }));

    return Response.json({ created });
  } catch (error) {
    return Response.json({ error: asErrorMessage(error) }, { status: 400 });
  }
}
