import { XtreamAccountInfo, XtreamContentKind, XtreamPlaybackSource, XtreamStreamResolutionRequest } from '@/xtream/types';

interface XtreamConnectionLike {
  playlistId: string;
  serverUrl: string;
  username: string;
  password: string;
}

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const safeSegment = (value: string) => encodeURIComponent(value).replace(/%2F/gi, '/');

export function chooseXtreamOutputFormat(kind: XtreamContentKind, account?: XtreamAccountInfo, requested?: string) {
  if (requested) return requested.replace(/^\./, '');
  const allowed = account?.allowedOutputFormats?.map((item) => item.replace(/^\./, '').toLowerCase()) ?? [];

  if (kind === 'live') {
    if (allowed.includes('m3u8')) return 'm3u8';
    if (allowed.includes('ts')) return 'ts';
    return 'ts';
  }

  if (allowed.includes('mp4')) return 'mp4';
  if (allowed.includes('mkv')) return 'mkv';
  if (allowed.includes('avi')) return 'avi';
  return 'mp4';
}

export function buildXtreamPlaybackSource(
  connection: XtreamConnectionLike,
  input: XtreamStreamResolutionRequest,
  account?: XtreamAccountInfo,
): XtreamPlaybackSource {
  const extension = chooseXtreamOutputFormat(input.kind, account, input.outputFormat);
  const pathPrefix = input.kind === 'live' ? 'live' : input.kind === 'movie' ? 'movie' : 'series';
  const uri = `${normalizeBaseUrl(connection.serverUrl)}/${pathPrefix}/${safeSegment(connection.username)}/${safeSegment(connection.password)}/${safeSegment(input.streamId)}.${extension}`;

  return {
    id: `xtream-source:${input.playlistId}:${input.kind}:${input.streamId}`,
    playlistId: input.playlistId,
    streamId: input.streamId,
    kind: input.kind,
    uri,
    containerExtension: extension,
    isLive: input.kind === 'live',
    resolvedAt: new Date().toISOString(),
  };
}
