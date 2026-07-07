export interface M3uPlaylistConnectionModel {
  playlistId: string;
  sourceUri: string;
  epgUri?: string;
}

export interface M3uExternalRefs {
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  groupTitle?: string;
  sourceUri?: string;
}
