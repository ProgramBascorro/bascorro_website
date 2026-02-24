import type { Annotation, ClassDef } from '@/lib/dataset-lab/types';

export type LabAnnotation = Annotation;

export interface LabImageItem {
  id: string;
  session: string;
  rel_path: string;
  sha256: string;
  width: number;
  height: number;
  created_at: string;
  imageUrl: string;
  thumbnailUrl: string;
}

export interface LabState {
  dataset: string;
  session: string;
  token: string;
  classes: ClassDef[];
  images: LabImageItem[];
  selectedImageId: string | null;
  annotations: LabAnnotation[];
  selectedAnnotationId: string | null;
}
