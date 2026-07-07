import { M3UStreamKind, M3UStreamMetadata, ParsedM3UEntry } from '@/m3u/types';

const now = () => new Date().toISOString();
const normalizeId = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const categoryIdForGroup = (playlistId: string, groupTitle: string) =>
  `${playlistId}:group:${normalizeId(groupTitle || 'uncategorized')}`;

export function inferM3UKind(entry: ParsedM3UEntry): M3UStreamKind {
  const text = `${entry.groupTitle} ${entry.title} ${entry.url}`.toLowerCase();
  if (text.includes('movie') || text.includes('vod')) return 'movie';
  if (text.includes('series') || text.includes('season') || /s\d{1,2}e\d{1,2}/.test(text)) return 'series';
  if (entry.url.includes('.m3u8') || entry.url.includes('/live/')) return 'live';
  return 'unknown';
}

export function mapParsedEntry(playlistId: string, entry: ParsedM3UEntry): M3UStreamMetadata {
  const categoryId = categoryIdForGroup(playlistId, entry.groupTitle);
  const stableBase = entry.attributes['tvg-id'] || entry.attributes['tvg-name'] || entry.url;
  return {
    id: `${playlistId}:m3u:${normalizeId(stableBase)}`,
    playlistId,
    categoryId,
    title: entry.title,
    url: entry.url,
    logoUrl: entry.attributes['tvg-logo'],
    tvgId: entry.attributes['tvg-id'],
    tvgName: entry.attributes['tvg-name'],
    groupTitle: entry.groupTitle,
    kind: inferM3UKind(entry),
    catchup: entry.attributes.catchup,
    catchupSource: entry.attributes['catchup-source'],
    rawAttributes: entry.attributes,
    updatedAt: now(),
  };
}
