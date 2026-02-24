import { readFile, writeFile } from 'node:fs/promises';
import type { Annotation, ClassDef, LabelDocument } from './types';
import { labelFilePath, labelJsonFilePath } from './paths';
import { isSmallBox, normalizeXyxy, xyxyToYolo, yoloToXyxy } from './coords';

function formatYoloNumber(value: number): string {
  return value.toFixed(6);
}

export function annotationToYoloLine(
  annotation: Annotation,
  imageWidth: number,
  imageHeight: number,
): string | null {
  const normalized = normalizeXyxy(annotation.bbox_xyxy, imageWidth, imageHeight);
  if (isSmallBox(normalized)) {
    return null;
  }

  const [cx, cy, w, h] = xyxyToYolo(normalized, imageWidth, imageHeight);
  return [
    annotation.class_id,
    formatYoloNumber(cx),
    formatYoloNumber(cy),
    formatYoloNumber(w),
    formatYoloNumber(h),
  ].join(' ');
}

export function yoloLineToAnnotation(
  line: string,
  imageWidth: number,
  imageHeight: number,
  classById: Map<number, string>,
): Annotation | null {
  const parts = line.trim().split(/\s+/);
  if (parts.length !== 5) {
    return null;
  }

  const classId = Number.parseInt(parts[0], 10);
  const cx = Number.parseFloat(parts[1]);
  const cy = Number.parseFloat(parts[2]);
  const w = Number.parseFloat(parts[3]);
  const h = Number.parseFloat(parts[4]);

  if ([classId, cx, cy, w, h].some((n) => Number.isNaN(n))) {
    return null;
  }

  const className = classById.get(classId) ?? `class_${classId}`;
  const bbox = yoloToXyxy([cx, cy, w, h], imageWidth, imageHeight);

  return {
    id: `${classId}_${Math.random().toString(36).slice(2, 8)}`,
    class_id: classId,
    class_name: className,
    bbox_xyxy: bbox,
  };
}

export async function readLabelDocument(
  dataset: string,
  session: string,
  id: string,
  imageWidth: number,
  imageHeight: number,
  classes: ClassDef[],
): Promise<LabelDocument> {
  const file = labelFilePath(dataset, session, id);
  const classById = new Map(classes.map((cls) => [cls.class_id, cls.class_name]));

  try {
    const raw = await readFile(file, 'utf8');
    const annotations = raw
      .split(/\r?\n/)
      .map((line) => yoloLineToAnnotation(line, imageWidth, imageHeight, classById))
      .filter((item): item is Annotation => item !== null);

    return {
      image_id: id,
      image_width: imageWidth,
      image_height: imageHeight,
      annotations,
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }

    return {
      image_id: id,
      image_width: imageWidth,
      image_height: imageHeight,
      annotations: [],
      updated_at: new Date().toISOString(),
    };
  }
}

export async function writeLabelDocument(
  dataset: string,
  session: string,
  id: string,
  imageWidth: number,
  imageHeight: number,
  annotations: Annotation[],
): Promise<LabelDocument> {
  const lines = annotations
    .map((annotation) => annotationToYoloLine(annotation, imageWidth, imageHeight))
    .filter((line): line is string => line !== null);

  const txtPath = labelFilePath(dataset, session, id);
  await writeFile(txtPath, lines.join('\n'), 'utf8');

  const doc: LabelDocument = {
    image_id: id,
    image_width: imageWidth,
    image_height: imageHeight,
    annotations: annotations.map((item) => ({
      ...item,
      bbox_xyxy: normalizeXyxy(item.bbox_xyxy, imageWidth, imageHeight),
    })),
    updated_at: new Date().toISOString(),
  };

  const cachePath = labelJsonFilePath(dataset, session, id);
  await writeFile(cachePath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');

  return doc;
}
