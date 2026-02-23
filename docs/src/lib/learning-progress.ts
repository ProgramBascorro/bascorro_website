export const LEARNING_PROGRESS_KEY = 'bascorro-learning-progress:v1';
export const LEARNING_PROGRESS_EVENT = 'learning-progress-updated';

export interface LearningProgressEntry {
  completedAt: string;
}

export type LearningProgressMap = Record<string, LearningProgressEntry>;

export function readLearningProgress(): LearningProgressMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LEARNING_PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as LearningProgressMap;
  } catch {
    return {};
  }
}

export function writeLearningProgress(progress: LearningProgressMap) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify(progress));
    window.dispatchEvent(
      new CustomEvent(LEARNING_PROGRESS_EVENT, { detail: progress }),
    );
  } catch {
    // ignore write failures
  }
}
