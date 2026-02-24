export interface ManifestItem {
  id: string;
  session: string;
  rel_path: string;
  sha256: string;
  width: number;
  height: number;
  created_at: string;
}

export interface DatasetManifest {
  dataset: string;
  created_at: string;
  items: ManifestItem[];
}

export interface ClassDef {
  class_id: number;
  class_name: string;
}

export interface Annotation {
  id: string;
  class_id: number;
  class_name: string;
  bbox_xyxy: [number, number, number, number];
  confidence?: number;
}

export interface LabelDocument {
  image_id: string;
  image_width: number;
  image_height: number;
  annotations: Annotation[];
  updated_at: string;
}

export interface SplitRatios {
  train: number;
  val: number;
  test: number;
}

export interface SplitResult {
  train: string[];
  val: string[];
  test: string[];
}

export interface SaveImageResult {
  id: string;
  path: string;
  relPath: string;
  width: number;
  height: number;
  sha256: string;
  createdAt: string;
}

export interface GeminiAssistResponse {
  image_width: number;
  image_height: number;
  annotations: Array<{
    class_name: string;
    class_id: number;
    bbox_xyxy: [number, number, number, number];
    confidence: number;
  }>;
  warnings: string[];
}
