'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Annotation, ClassDef } from '@/lib/dataset-lab/types';
import type { LabImageItem } from '../types';

interface JsonError {
  error?: string;
}

interface GeminiPayload {
  image_width: number;
  image_height: number;
  annotations: Array<{
    class_name: string;
    class_id: number;
    bbox_xyxy: [number, number, number, number];
    confidence: number;
  }>;
  warnings?: string[];
}

function todaySession(): string {
  const d = new Date();
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  return `session_${d.getFullYear()}-${mm}-${dd}`;
}

function createAnnotationId(): string {
  return `ann_${Math.random().toString(36).slice(2, 9)}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & JsonError;
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }
  return data;
}

export function useDatasetLab() {
  const [dataset, setDataset] = useState('soccer_v1');
  const [session, setSession] = useState(todaySession);
  const [token, setToken] = useState('');

  const [classes, setClasses] = useState<ClassDef[]>([]);
  const [images, setImages] = useState<LabImageItem[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [geminiEnabled, setGeminiEnabled] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);

  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const stored = window.sessionStorage.getItem('dataset_lab_token');
    if (stored) {
      setToken(stored);
    }
  }, []);

  useEffect(() => {
    if (token) {
      window.sessionStorage.setItem('dataset_lab_token', token);
    }
  }, [token]);

  const authHeaders = useMemo(() => {
    if (!token) {
      return {} as Record<string, string>;
    }
    return { 'x-lab-token': token };
  }, [token]);

  const selectedImage = useMemo(
    () => images.find((img) => img.id === selectedImageId) ?? null,
    [images, selectedImageId],
  );

  const apiBase = useMemo(
    () => `/api/datasets/${encodeURIComponent(dataset)}`,
    [dataset],
  );

  const loadClasses = useCallback(async () => {
    if (!token) {
      return;
    }
    const response = await fetch(`${apiBase}/classes`, {
      headers: authHeaders,
      cache: 'no-store',
    });
    const data = await readJson<{ classes: ClassDef[] }>(response);
    setClasses(data.classes);
  }, [apiBase, authHeaders, token]);

  const loadGeminiStatus = useCallback(async () => {
    if (!token) {
      return;
    }
    const response = await fetch(`${apiBase}/assist/gemini`, {
      headers: authHeaders,
      cache: 'no-store',
    });
    if (!response.ok) {
      setGeminiEnabled(false);
      return;
    }
    const data = await response.json() as { enabled?: boolean };
    setGeminiEnabled(Boolean(data.enabled));
  }, [apiBase, authHeaders, token]);

  const loadImages = useCallback(async () => {
    if (!token) {
      return;
    }

    const response = await fetch(
      `${apiBase}/sessions/${encodeURIComponent(session)}/images`,
      {
        headers: authHeaders,
        cache: 'no-store',
      },
    );
    const data = await readJson<{ images: LabImageItem[] }>(response);
    setImages(data.images);

    if (data.images.length === 0) {
      setSelectedImageId(null);
      setAnnotations([]);
      return;
    }

    setSelectedImageId((prev) => {
      if (prev && data.images.some((img) => img.id === prev)) {
        return prev;
      }
      return data.images[0].id;
    });
  }, [apiBase, authHeaders, session, token]);

  const loadLabels = useCallback(async () => {
    if (!selectedImage || !token) {
      setAnnotations([]);
      return;
    }

    const response = await fetch(
      `${apiBase}/sessions/${encodeURIComponent(session)}/labels/${encodeURIComponent(selectedImage.id)}`,
      {
        headers: authHeaders,
        cache: 'no-store',
      },
    );
    const data = await readJson<{
      annotations: Annotation[];
      image_width: number;
      image_height: number;
    }>(response);
    setAnnotations(data.annotations);
    setSelectedAnnotationId(null);
  }, [apiBase, authHeaders, selectedImage, session, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    setLoading(true);
    setErrorMessage('');

    Promise.all([loadClasses(), loadGeminiStatus(), loadImages()])
      .catch((error: unknown) => {
        setErrorMessage((error as Error).message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, dataset, session, loadClasses, loadGeminiStatus, loadImages]);

  useEffect(() => {
    loadLabels().catch((error: unknown) => {
      setErrorMessage((error as Error).message);
    });
  }, [loadLabels]);

  const uploadImages = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) {
        return;
      }
      if (!token) {
        setErrorMessage('Set Dataset Lab token first.');
        return;
      }

      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append('files', file);
      }

      setSaving(true);
      setErrorMessage('');
      try {
        const response = await fetch(
          `${apiBase}/sessions/${encodeURIComponent(session)}/images`,
          {
            method: 'POST',
            headers: authHeaders,
            body: formData,
          },
        );
        const data = await readJson<{ created: LabImageItem[] }>(response);
        setStatusMessage(`Uploaded ${data.created.length} image(s).`);
        await loadImages();
      } catch (error) {
        setErrorMessage((error as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [apiBase, authHeaders, loadImages, session, token],
  );

  const saveLabels = useCallback(async () => {
    if (!selectedImage || !token) {
      return;
    }

    setSaving(true);
    setErrorMessage('');
    try {
      const response = await fetch(
        `${apiBase}/sessions/${encodeURIComponent(session)}/labels/${encodeURIComponent(selectedImage.id)}`,
        {
          method: 'PUT',
          headers: {
            ...authHeaders,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            image_width: selectedImage.width,
            image_height: selectedImage.height,
            annotations,
          }),
        },
      );

      await readJson<{ ok: boolean }>(response);
      setStatusMessage('Labels saved.');
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  }, [annotations, apiBase, authHeaders, selectedImage, session, token]);

  const suggestWithGemini = useCallback(async () => {
    if (!selectedImage || !token) {
      return;
    }

    setGeminiLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${apiBase}/assist/gemini`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ session, id: selectedImage.id }),
      });

      if (response.status === 501) {
        const data = await response.json() as JsonError;
        setGeminiEnabled(false);
        setErrorMessage(data.error ?? 'Gemini is not configured.');
        return;
      }

      const data = await readJson<GeminiPayload>(response);

      const next = data.annotations.map((item) => ({
        id: createAnnotationId(),
        class_id: item.class_id,
        class_name: item.class_name,
        bbox_xyxy: item.bbox_xyxy,
        confidence: item.confidence,
      }));

      setAnnotations(next);
      setSelectedAnnotationId(null);
      setStatusMessage(
        data.warnings?.length
          ? `Gemini suggested ${next.length} boxes with warnings.`
          : `Gemini suggested ${next.length} boxes.`,
      );
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setGeminiLoading(false);
    }
  }, [apiBase, authHeaders, selectedImage, session, token]);

  const generateSplits = useCallback(async () => {
    if (!token) {
      return;
    }

    setSaving(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${apiBase}/splits`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ ratios: { train: 0.7, val: 0.2, test: 0.1 }, seed: 42 }),
      });
      const data = await readJson<{ total: number }>(response);
      setStatusMessage(`Generated splits for ${data.total} images.`);
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  }, [apiBase, authHeaders, token]);

  const exportZip = useCallback(async () => {
    if (!token) {
      return;
    }

    setSaving(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${apiBase}/export`, {
        headers: authHeaders,
      });
      if (!response.ok) {
        const data = await response.json() as JsonError;
        throw new Error(data.error ?? 'Export failed.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataset}_labels_export.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage('Export downloaded.');
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  }, [apiBase, authHeaders, dataset, token]);

  const nextImage = useCallback(() => {
    if (!images.length || !selectedImageId) {
      return;
    }
    const index = images.findIndex((img) => img.id === selectedImageId);
    if (index >= 0 && index < images.length - 1) {
      setSelectedImageId(images[index + 1].id);
    }
  }, [images, selectedImageId]);

  const prevImage = useCallback(() => {
    if (!images.length || !selectedImageId) {
      return;
    }
    const index = images.findIndex((img) => img.id === selectedImageId);
    if (index > 0) {
      setSelectedImageId(images[index - 1].id);
    }
  }, [images, selectedImageId]);

  return {
    dataset,
    setDataset,
    session,
    setSession,
    token,
    setToken,
    classes,
    images,
    selectedImage,
    selectedImageId,
    setSelectedImageId,
    annotations,
    setAnnotations,
    selectedAnnotationId,
    setSelectedAnnotationId,
    loading,
    saving,
    geminiEnabled,
    geminiLoading,
    statusMessage,
    errorMessage,
    uploadImages,
    saveLabels,
    suggestWithGemini,
    generateSplits,
    exportZip,
    nextImage,
    prevImage,
  };
}
