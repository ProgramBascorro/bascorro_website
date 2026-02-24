'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LearningTrack } from '@/lib/learning-pages';
import {
  LEARNING_PROGRESS_EVENT,
  readLearningProgress,
  type LearningProgressMap,
} from '@/lib/learning-progress';

interface LearningProgressSummaryClientProps {
  tracks: LearningTrack[];
}

export function LearningProgressSummaryClient({
  tracks,
}: LearningProgressSummaryClientProps) {
  const [progress, setProgress] = useState<LearningProgressMap>({});

  useEffect(() => {
    setProgress(readLearningProgress());
    const onProgressUpdate = () => setProgress(readLearningProgress());
    window.addEventListener(LEARNING_PROGRESS_EVENT, onProgressUpdate);
    return () =>
      window.removeEventListener(LEARNING_PROGRESS_EVENT, onProgressUpdate);
  }, []);

  const overall = useMemo(() => {
    const total = tracks.reduce((acc, track) => acc + track.pages.length, 0);
    const completed = tracks.reduce(
      (acc, track) => acc + track.pages.filter((page) => progress[page.slug]).length,
      0,
    );
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percent };
  }, [tracks, progress]);

  return (
    <div className="my-6 rounded-xl border border-fd-border bg-fd-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-fd-foreground">Learning Progress</div>
          <div className="text-xs text-fd-muted-foreground">
            {overall.completed} dari {overall.total} halaman selesai
          </div>
        </div>
        <div className="text-xs font-medium text-fd-muted-foreground">
          {overall.percent}%
        </div>
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-2 rounded-full bg-blue-500 transition-all"
          style={{ width: `${overall.percent}%` }}
        />
      </div>

      <div className="mt-4 space-y-3">
        {tracks.map((track) => {
          const completed = track.pages.filter((page) => progress[page.slug]).length;
          const total = track.pages.length;
          const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

          return (
            <div key={track.id} className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-fd-foreground">{track.title}</span>
                <span className="text-xs text-fd-muted-foreground">
                  {completed}/{total} ({percent}%)
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
                <div
                  className="h-2 rounded-full bg-green-500 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
