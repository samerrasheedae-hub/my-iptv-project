export interface XtreamPlaylistConnectionModel {
  playlistId: string;
  serverUrl: string;
  usernameRef: string;
  passwordRef: string;
}

export interface XtreamExternalRefs {
  streamId?: string;
  categoryId?: string;
  seriesId?: string;
  episodeId?: string;
}
