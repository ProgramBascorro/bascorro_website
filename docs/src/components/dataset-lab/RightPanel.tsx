'use client';

import type { Annotation, ClassDef } from '@/lib/dataset-lab/types';
import { formatBox } from './utils/coords';

interface RightPanelProps {
  classes: ClassDef[];
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  setSelectedAnnotationId: (id: string | null) => void;
  setAnnotations: (next: Annotation[]) => void;
  onSaveLabels: () => void;
  onSuggestGemini: () => void;
  onGenerateSplits: () => void;
  onExportZip: () => void;
  saving?: boolean;
  geminiEnabled?: boolean;
  geminiLoading?: boolean;
}

export function RightPanel({
  classes,
  annotations,
  selectedAnnotationId,
  setSelectedAnnotationId,
  setAnnotations,
  onSaveLabels,
  onSuggestGemini,
  onGenerateSplits,
  onExportZip,
  saving,
  geminiEnabled,
  geminiLoading,
}: RightPanelProps) {
  const selected = annotations.find((ann) => ann.id === selectedAnnotationId) ?? null;

  const updateSelectedClass = (classId: number) => {
    const cls = classes.find((item) => item.class_id === classId);
    if (!selected || !cls) {
      return;
    }

    setAnnotations(
      annotations.map((item) =>
        item.id === selected.id
          ? { ...item, class_id: cls.class_id, class_name: cls.class_name }
          : item,
      ),
    );
  };

  const deleteAnnotation = (id: string) => {
    const next = annotations.filter((item) => item.id !== id);
    setAnnotations(next);
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
    }
  };

  return (
    <aside className="w-full lg:w-80 border-l border-gray-200 p-4 bg-white space-y-4">
      <h3 className="text-lg font-semibold">Annotations</h3>

      {selected && (
        <div className="rounded border border-gray-200 p-3 space-y-2">
          <div className="text-sm font-medium">Selected Box</div>
          <label className="block text-sm">
            <span className="text-gray-600">Class</span>
            <select
              value={selected.class_id}
              onChange={(e) => updateSelectedClass(Number(e.target.value))}
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5"
            >
              {classes.map((cls) => (
                <option key={cls.class_id} value={cls.class_id}>
                  {cls.class_id}: {cls.class_name}
                </option>
              ))}
            </select>
          </label>
          <div className="text-xs text-gray-500">{formatBox(selected.bbox_xyxy)}</div>
        </div>
      )}

      <div className="space-y-2 max-h-[36vh] overflow-y-auto pr-1">
        {annotations.map((ann, index) => (
          <div
            key={ann.id}
            className={`rounded border p-2 text-sm ${
              selectedAnnotationId === ann.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'
            }`}
          >
            <button
              className="w-full text-left"
              onClick={() => setSelectedAnnotationId(ann.id)}
            >
              <div className="font-medium">
                #{index + 1} {ann.class_name}
              </div>
              <div className="text-xs text-gray-500">{formatBox(ann.bbox_xyxy)}</div>
            </button>
            <button
              className="mt-2 text-xs text-red-600 hover:underline"
              onClick={() => deleteAnnotation(ann.id)}
            >
              Delete
            </button>
          </div>
        ))}
        {!annotations.length && (
          <div className="text-sm text-gray-500">No boxes yet.</div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 pt-2">
        <button
          onClick={onSaveLabels}
          disabled={saving}
          className="rounded bg-blue-600 text-white px-3 py-2 text-sm font-medium disabled:opacity-50"
        >
          Save Labels
        </button>
        <button
          onClick={onSuggestGemini}
          disabled={!geminiEnabled || geminiLoading}
          className="rounded border border-gray-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
        >
          Suggest Labels (Gemini)
        </button>
        <button
          onClick={onGenerateSplits}
          disabled={saving}
          className="rounded border border-gray-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
        >
          Generate Splits
        </button>
        <button
          onClick={onExportZip}
          disabled={saving}
          className="rounded border border-gray-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
        >
          Export Dataset ZIP
        </button>
      </div>
    </aside>
  );
}
