import { getLearningTracks } from '@/lib/learning-pages';
import { LearningProgressSummaryClient } from './LearningProgressSummaryClient';

export function LearningProgressSummary() {
  const tracks = getLearningTracks();
  return <LearningProgressSummaryClient tracks={tracks} />;
}
