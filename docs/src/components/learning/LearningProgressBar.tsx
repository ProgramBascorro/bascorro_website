'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import type { LearningTrack } from '@/lib/learning-pages';
import {
  readLearningProgress,
  LEARNING_PROGRESS_EVENT,
  type LearningProgressMap,
} from '@/lib/learning-progress';

interface LearningProgressBarProps {
  currentSlug: string;
  track: LearningTrack;
}

export function LearningProgressBar({ currentSlug, track }: LearningProgressBarProps) {
  const [progress, setProgress] = useState<LearningProgressMap>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isHydrated, setIsHydrated] = useState(false);
  const prevProgressRef = useRef<LearningProgressMap | null>(null);

  useEffect(() => {
    setProgress(readLearningProgress());
    setIsHydrated(true);

    const onProgressUpdate = () => {
      setProgress(readLearningProgress());
    };
    window.addEventListener(LEARNING_PROGRESS_EVENT, onProgressUpdate);
    return () => window.removeEventListener(LEARNING_PROGRESS_EVENT, onProgressUpdate);
  }, []);

  const isCompleted = Boolean(progress[currentSlug]);

  useEffect(() => {
    const updateSize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const { completedCount, totalCount, percent } = useMemo(() => {
    const total = track.pages.length;
    const completed = track.pages.filter((page) => progress[page.slug]).length;
    const percentValue = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completedCount: completed, totalCount: total, percent: percentValue };
  }, [track.pages, progress]);

  useEffect(() => {
    if (!isHydrated || !currentSlug) return;

    // First hydrated snapshot is baseline; don't celebrate historical completions.
    if (prevProgressRef.current === null) {
      prevProgressRef.current = progress;
      return;
    }

    const wasCompleted = Boolean(prevProgressRef.current[currentSlug]);
    const nowCompleted = Boolean(progress[currentSlug]);
    if (!wasCompleted && nowCompleted) {
      setShowConfetti(true);
    }
    prevProgressRef.current = progress;
  }, [currentSlug, isHydrated, progress]);

  return (
    <div className="mb-6 rounded-lg border border-fd-border bg-fd-card p-4">
      {showConfetti && windowSize.width > 0 && windowSize.height > 0 && (
        <div className="pointer-events-none fixed inset-0 z-50">
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            numberOfPieces={220}
            recycle={false}
            tweenDuration={2500}
            onConfettiComplete={() => setShowConfetti(false)}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-fd-foreground">{track.title}</div>
          <div className="text-xs text-fd-muted-foreground">
            {completedCount} dari {totalCount} halaman selesai
          </div>
        </div>
        <div
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            isCompleted
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
          }`}
        >
          {isCompleted ? 'Completed' : 'In Progress'}
        </div>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-2 rounded-full bg-green-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-2 text-xs text-fd-muted-foreground">
        Scroll sampai 80% untuk menandai halaman selesai.
      </div>
    </div>
  );
}
