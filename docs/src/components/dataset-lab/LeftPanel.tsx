'use client';

import type { LabImageItem } from './types';

interface LeftPanelProps {
  dataset: string;
  setDataset: (value: string) => void;
  session: string;
  setSession: (value: string) => void;
  token: string;
  setToken: (value: string) => void;
  images: LabImageItem[];
  selectedImageId: string | null;
  onSelectImage: (id: string) => void;
  onUpload: (files: FileList | null) => void;
  disabled?: boolean;
}

export function LeftPanel({
  dataset,
  setDataset,
  session,
  setSession,
  token,
  setToken,
  images,
  selectedImageId,
  onSelectImage,
  onUpload,
  disabled,
}: LeftPanelProps) {
  return (
    <aside className="w-full lg:w-72 border-r border-gray-200 p-4 bg-white space-y-4">
      <h2 className="text-lg font-semibold">Dataset Lab</h2>

      <label className="block text-sm">
        <span className="text-gray-600">Dataset</span>
        <input
          value={dataset}
          onChange={(e) => setDataset(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5"
          placeholder="soccer_v1"
        />
      </label>

      <label className="block text-sm">
        <span className="text-gray-600">Session</span>
        <input
          value={session}
          onChange={(e) => setSession(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5"
          placeholder="session_YYYY-MM-DD"
        />
      </label>

      <label className="block text-sm">
        <span className="text-gray-600">Lab Token</span>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5"
          placeholder="DATASET_LAB_TOKEN"
        />
      </label>

      <label className="block text-sm">
        <span className="text-gray-600">Upload Images</span>
        <input
          type="file"
          accept="image/jpeg,image/png"
          multiple
          disabled={disabled}
          onChange={(e) => onUpload(e.target.files)}
          className="mt-1 w-full text-sm"
        />
      </label>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Images</h3>
        <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
          {images.map((image) => (
            <button
              key={image.id}
              onClick={() => onSelectImage(image.id)}
              className={`w-full text-left rounded border p-2 transition ${
                selectedImageId === image.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <img
                src={image.thumbnailUrl}
                alt={image.id}
                className="w-full h-20 object-cover rounded"
              />
              <div className="mt-1 text-xs text-gray-600">{image.id}</div>
              <div className="text-xs text-gray-500">
                {image.width}x{image.height}
              </div>
            </button>
          ))}
          {!images.length && (
            <p className="text-xs text-gray-500">No images in this session.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
