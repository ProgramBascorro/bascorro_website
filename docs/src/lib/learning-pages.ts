import { source } from '@/lib/source';

export interface LearningPage {
  slug: string;
  title: string;
}

export interface LearningTrack {
  id: string;
  title: string;
  pages: LearningPage[];
}

function toTitleCase(value: string) {
  return value
    .split('-')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

export function getLearningTracks(): LearningTrack[] {
  const pages = source.getPages();
  const trackMap = new Map<string, LearningTrack>();

  for (const page of pages) {
    if (page.slugs[0] !== 'learning') continue;
    if (page.slugs.length === 1) continue; // skip learning index

    const trackId = page.slugs[1];
    if (!trackId) continue;

    if (!trackMap.has(trackId)) {
      trackMap.set(trackId, {
        id: trackId,
        title: toTitleCase(trackId),
        pages: [],
      });
    }

    const track = trackMap.get(trackId);
    if (!track) continue;

    const slug = page.slugs.join('/');
    const title = page.data.title ?? slug;

    if (page.slugs.length === 2) {
      track.title = page.data.title ?? track.title;
    }

    track.pages.push({ slug, title });
  }

  return Array.from(trackMap.values());
}
