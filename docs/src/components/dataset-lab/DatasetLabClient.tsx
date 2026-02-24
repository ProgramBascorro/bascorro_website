'use client';

import { useEffect } from 'react';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { LabelCanvas } from './LabelCanvas';
import { useDatasetLab } from './hooks/useDatasetLab';

export default function DatasetLabClient() {
  const {
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
  } = useDatasetLab();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveLabels();
        return;
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedAnnotationId) {
        event.preventDefault();
        setAnnotations(annotations.filter((ann) => ann.id !== selectedAnnotationId));
        setSelectedAnnotationId(null);
        return;
      }

      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        nextImage();
        return;
      }

      if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        prevImage();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    annotations,
    nextImage,
    prevImage,
    saveLabels,
    selectedAnnotationId,
    setAnnotations,
    setSelectedAnnotationId,
  ]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-xl font-bold">Bascorro Studio - Dataset Lab</h1>
        <p className="text-sm text-gray-600">
          Local-first labeling tool (YOLO bbox) with optional Gemini suggestions.
        </p>
        {statusMessage && <p className="text-sm text-green-700 mt-1">{statusMessage}</p>}
        {errorMessage && <p className="text-sm text-red-700 mt-1">{errorMessage}</p>}
      </div>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-96px)]">
        <LeftPanel
          dataset={dataset}
          setDataset={setDataset}
          session={session}
          setSession={setSession}
          token={token}
          setToken={setToken}
          images={images}
          selectedImageId={selectedImageId}
          onSelectImage={setSelectedImageId}
          onUpload={uploadImages}
          disabled={loading || saving}
        />

        <section className="flex-1 p-4">
          <div className="h-[70vh] lg:h-[calc(100vh-150px)] rounded border border-gray-200 bg-white p-3">
            <LabelCanvas
              imageUrl={selectedImage?.imageUrl ?? null}
              imageWidth={selectedImage?.width ?? 0}
              imageHeight={selectedImage?.height ?? 0}
              classes={classes}
              annotations={annotations}
              setAnnotations={setAnnotations}
              selectedAnnotationId={selectedAnnotationId}
              setSelectedAnnotationId={setSelectedAnnotationId}
            />
          </div>
        </section>

        <RightPanel
          classes={classes}
          annotations={annotations}
          selectedAnnotationId={selectedAnnotationId}
          setSelectedAnnotationId={setSelectedAnnotationId}
          setAnnotations={setAnnotations}
          onSaveLabels={saveLabels}
          onSuggestGemini={suggestWithGemini}
          onGenerateSplits={generateSplits}
          onExportZip={exportZip}
          saving={saving}
          geminiEnabled={geminiEnabled}
          geminiLoading={geminiLoading}
        />
      </div>
    </main>
  );
}
