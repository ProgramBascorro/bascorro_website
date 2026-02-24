'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Image as KonvaImage, Transformer } from 'react-konva';
import type { Annotation, ClassDef } from '@/lib/dataset-lab/types';
import { normalizeBoxForImage } from './utils/coords';

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0f766e'];

interface LabelCanvasProps {
  imageUrl: string | null;
  imageWidth: number;
  imageHeight: number;
  classes: ClassDef[];
  annotations: Annotation[];
  setAnnotations: (next: Annotation[]) => void;
  selectedAnnotationId: string | null;
  setSelectedAnnotationId: (id: string | null) => void;
}

type DraftBox = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

function annotationColor(classId: number): string {
  return COLORS[classId % COLORS.length];
}

export function LabelCanvas({
  imageUrl,
  imageWidth,
  imageHeight,
  classes,
  annotations,
  setAnnotations,
  selectedAnnotationId,
  setSelectedAnnotationId,
}: LabelCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const rectRefs = useRef<Record<string, Konva.Rect | null>>({});

  const [canvasSize, setCanvasSize] = useState({ width: 960, height: 640 });
  const [mode, setMode] = useState<'draw' | 'pan'>('draw');
  const [viewport, setViewport] = useState({ scale: 1, x: 0, y: 0 });
  const [draft, setDraft] = useState<DraftBox | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect;
      if (!next) {
        return;
      }
      setCanvasSize({ width: Math.max(480, next.width), height: Math.max(420, next.height) });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!imageUrl) {
      setImage(null);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
  }, [imageUrl]);

  useEffect(() => {
    if (!imageWidth || !imageHeight) {
      return;
    }

    const fit = Math.min(canvasSize.width / imageWidth, canvasSize.height / imageHeight);
    const scale = Number.isFinite(fit) && fit > 0 ? fit : 1;
    const x = (canvasSize.width - imageWidth * scale) / 2;
    const y = (canvasSize.height - imageHeight * scale) / 2;
    setViewport({ scale, x, y });
  }, [imageWidth, imageHeight, canvasSize.width, canvasSize.height]);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) {
      return;
    }

    const selectedNode = selectedAnnotationId
      ? rectRefs.current[selectedAnnotationId]
      : null;

    if (selectedNode) {
      transformer.nodes([selectedNode]);
    } else {
      transformer.nodes([]);
    }
    transformer.getLayer()?.batchDraw();
  }, [selectedAnnotationId, annotations]);

  const stageToImagePoint = (stage: Konva.Stage) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) {
      return null;
    }

    return {
      x: (pointer.x - viewport.x) / viewport.scale,
      y: (pointer.y - viewport.y) / viewport.scale,
    };
  };

  const bounded = (x: number, y: number) => ({
    x: Math.max(0, Math.min(imageWidth, x)),
    y: Math.max(0, Math.min(imageHeight, y)),
  });

  const draftRect = useMemo(() => {
    if (!draft) {
      return null;
    }
    const x1 = Math.min(draft.startX, draft.endX);
    const y1 = Math.min(draft.startY, draft.endY);
    const x2 = Math.max(draft.startX, draft.endX);
    const y2 = Math.max(draft.startY, draft.endY);
    return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
  }, [draft]);

  const addAnnotationFromDraft = () => {
    if (!draft || classes.length === 0) {
      setDraft(null);
      return;
    }

    const bbox = normalizeBoxForImage(
      [draft.startX, draft.startY, draft.endX, draft.endY],
      imageWidth,
      imageHeight,
    );

    const width = Math.abs(bbox[2] - bbox[0]);
    const height = Math.abs(bbox[3] - bbox[1]);
    if (width < 3 || height < 3) {
      setDraft(null);
      return;
    }

    const cls = classes[0];
    const id = `ann_${Math.random().toString(36).slice(2, 9)}`;

    const next: Annotation = {
      id,
      class_id: cls.class_id,
      class_name: cls.class_name,
      bbox_xyxy: bbox,
    };

    setAnnotations([...annotations, next]);
    setSelectedAnnotationId(id);
    setDraft(null);
  };

  const updateAnnotationBox = (id: string, bbox: [number, number, number, number]) => {
    const normalized = normalizeBoxForImage(bbox, imageWidth, imageHeight);
    setAnnotations(
      annotations.map((ann) =>
        ann.id === id
          ? { ...ann, bbox_xyxy: normalized }
          : ann,
      ),
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-sm text-gray-600">
          {imageWidth > 0 ? `${imageWidth} x ${imageHeight}` : 'No image selected'}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('draw')}
            className={`rounded px-3 py-1.5 text-sm border ${
              mode === 'draw' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'
            }`}
          >
            Draw
          </button>
          <button
            onClick={() => setMode('pan')}
            className={`rounded px-3 py-1.5 text-sm border ${
              mode === 'pan' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'
            }`}
          >
            Pan
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 rounded border border-gray-200 bg-gray-100 overflow-hidden">
        <Stage
          width={canvasSize.width}
          height={canvasSize.height}
          scaleX={viewport.scale}
          scaleY={viewport.scale}
          x={viewport.x}
          y={viewport.y}
          draggable={mode === 'pan'}
          onDragEnd={(e) => {
            if (mode !== 'pan') {
              return;
            }
            setViewport((prev) => ({ ...prev, x: e.target.x(), y: e.target.y() }));
          }}
          onWheel={(e) => {
            e.evt.preventDefault();
            const stage = e.target.getStage();
            if (!stage) {
              return;
            }
            const pointer = stage.getPointerPosition();
            if (!pointer) {
              return;
            }

            const oldScale = viewport.scale;
            const scaleBy = 1.05;
            const direction = e.evt.deltaY > 0 ? -1 : 1;
            const newScale = Math.max(0.1, Math.min(10, direction > 0 ? oldScale * scaleBy : oldScale / scaleBy));

            const mousePointTo = {
              x: (pointer.x - viewport.x) / oldScale,
              y: (pointer.y - viewport.y) / oldScale,
            };

            setViewport({
              scale: newScale,
              x: pointer.x - mousePointTo.x * newScale,
              y: pointer.y - mousePointTo.y * newScale,
            });
          }}
          onMouseDown={(e) => {
            if (mode !== 'draw') {
              return;
            }

            const stage = e.target.getStage();
            if (!stage) {
              return;
            }

            if (e.target.getClassName() !== 'Stage' && e.target.getClassName() !== 'Image') {
              return;
            }

            const p = stageToImagePoint(stage);
            if (!p) {
              return;
            }

            const safe = bounded(p.x, p.y);
            setSelectedAnnotationId(null);
            setDraft({ startX: safe.x, startY: safe.y, endX: safe.x, endY: safe.y });
          }}
          onMouseMove={(e) => {
            if (!draft || mode !== 'draw') {
              return;
            }
            const stage = e.target.getStage();
            if (!stage) {
              return;
            }
            const p = stageToImagePoint(stage);
            if (!p) {
              return;
            }
            const safe = bounded(p.x, p.y);
            setDraft((prev) => (prev ? { ...prev, endX: safe.x, endY: safe.y } : prev));
          }}
          onMouseUp={() => {
            if (mode === 'draw' && draft) {
              addAnnotationFromDraft();
            }
          }}
        >
          <Layer>
            {image && (
              <KonvaImage image={image} x={0} y={0} width={imageWidth} height={imageHeight} />
            )}

            {annotations.map((ann) => {
              const x = Math.min(ann.bbox_xyxy[0], ann.bbox_xyxy[2]);
              const y = Math.min(ann.bbox_xyxy[1], ann.bbox_xyxy[3]);
              const width = Math.abs(ann.bbox_xyxy[2] - ann.bbox_xyxy[0]);
              const height = Math.abs(ann.bbox_xyxy[3] - ann.bbox_xyxy[1]);

              return (
                <Rect
                  key={ann.id}
                  ref={(node) => {
                    rectRefs.current[ann.id] = node;
                  }}
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  stroke={annotationColor(ann.class_id)}
                  strokeWidth={selectedAnnotationId === ann.id ? 2.5 : 1.5}
                  fill="rgba(37,99,235,0.08)"
                  draggable
                  onClick={() => setSelectedAnnotationId(ann.id)}
                  onTap={() => setSelectedAnnotationId(ann.id)}
                  onDragEnd={(evt) => {
                    const node = evt.target;
                    const nextBbox: [number, number, number, number] = [
                      node.x(),
                      node.y(),
                      node.x() + width,
                      node.y() + height,
                    ];
                    updateAnnotationBox(ann.id, nextBbox);
                  }}
                  onTransformEnd={(evt) => {
                    const node = evt.target as Konva.Rect;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();

                    const nextWidth = Math.max(1, node.width() * scaleX);
                    const nextHeight = Math.max(1, node.height() * scaleY);

                    node.scaleX(1);
                    node.scaleY(1);

                    updateAnnotationBox(ann.id, [
                      node.x(),
                      node.y(),
                      node.x() + nextWidth,
                      node.y() + nextHeight,
                    ]);
                  }}
                />
              );
            })}

            {draftRect && (
              <Rect
                x={draftRect.x}
                y={draftRect.y}
                width={draftRect.width}
                height={draftRect.height}
                stroke="#ef4444"
                dash={[6, 4]}
              />
            )}

            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              enabledAnchors={[
                'top-left',
                'top-center',
                'top-right',
                'middle-left',
                'middle-right',
                'bottom-left',
                'bottom-center',
                'bottom-right',
              ]}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
