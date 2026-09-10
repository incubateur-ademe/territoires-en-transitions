import type { LienPreuve } from './build-liens-csv';

export interface ArchiveFile {
  folderSegments: string[];
  filename: string;
  bucketId: string;
  hash: string;
  filesize: number;
}

export interface ArchiveLinkFolder {
  folderSegments: string[];
  liens: LienPreuve[];
}

export interface SkippedFile {
  filename: string;
  emplacement: string;
  raison: string;
}

export interface ArchiveFolderArborescence {
  files: ArchiveFile[];
  linkFolders: ArchiveLinkFolder[];
  skippedFiles: SkippedFile[];
}
