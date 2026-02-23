import { z } from 'zod';
import { requireDatasetLabToken } from '@/lib/dataset-lab/auth';
import { readClasses } from '@/lib/dataset-lab/classes';
import { asErrorMessage, getParam } from '@/lib/dataset-lab/http';
import { findManifestItem, readManifest } from '@/lib/dataset-lab/manifest';
import { readLabelDocument, writeLabelDocument } from '@/lib/dataset-lab/labels';
import { ensureSessionDirs } from '@/lib/dataset-lab/paths';

export const runtime = 'nodejs';

const AnnotationSchema = z.object({
  id: z.string().min(1),
  class_id: z.number().int().nonnegative(),
  class_name: z.string().min(1),
  bbox_xyxy: z.tuple([
    z.number(),
    z.number(),
    z.number(),
    z.number(),
  ]),
  confidence: z.number().min(0).max(1).optional(),
});

const SaveLabelsSchema = z.object({
  image_width: z.number().positive().optional(),
  image_height: z.number().positive().optional(),
  annotations: z.array(AnnotationSchema),
});

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

    const manifest = await readManifest(safeDataset);
    const item = findManifestItem(manifest, safeSession, safeId);
    if (!item) {
      return Response.json({ error: 'Image not found in manifest.' }, { status: 404 });
    }

    const classes = await readClasses(safeDataset);
    const labels = await readLabelDocument(
      safeDataset,
      safeSession,
      safeId,
      item.width,
      item.height,
      classes,
    );

    return Response.json(labels);
  } catch (error) {
    return Response.json({ error: asErrorMessage(error) }, { status: 400 });
  }
}

export async function PUT(
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

    const parsed = SaveLabelsSchema.parse(await request.json());
    const manifest = await readManifest(safeDataset);
    const item = findManifestItem(manifest, safeSession, safeId);
    if (!item) {
      return Response.json({ error: 'Image not found in manifest.' }, { status: 404 });
    }

    await ensureSessionDirs(safeDataset, safeSession);

    const doc = await writeLabelDocument(
      safeDataset,
      safeSession,
      safeId,
      parsed.image_width ?? item.width,
      parsed.image_height ?? item.height,
      parsed.annotations,
    );

    return Response.json({ ok: true, labels: doc });
  } catch (error) {
    return Response.json({ error: asErrorMessage(error) }, { status: 400 });
  }
}
