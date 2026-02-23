'use client';

import { useEffect, useRef } from 'react';
import {
  readLearningProgress,
  writeLearningProgress,
} from '@/lib/learning-progress';

interface LearningCompletionMarkerProps {
  currentSlug: string;
}

export function LearningCompletionMarker({
  currentSlug,
}: LearningCompletionMarkerProps) {
  const markerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !currentSlug) return;

    const rootElement = document.querySelector('#nd-page');
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        const progress = readLearningProgress();
        if (progress[currentSlug]) return;
        writeLearningProgress({
          ...progress,
          [currentSlug]: { completedAt: new Date().toISOString() },
        });
      },
      {
        root: rootElement instanceof HTMLElement ? rootElement : null,
        threshold: 0.6,
      },
    );

    observer.observe(marker);
    return () => observer.disconnect();
  }, [currentSlug]);

  return <div ref={markerRef} className="h-1 w-full" aria-hidden="true" />;
}
