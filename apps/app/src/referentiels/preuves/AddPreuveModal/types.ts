import { DocumentHash } from '@tet/domain/collectivites';

export enum UploadStatusCode {
  preparing = 'preparing',
  running = 'running',
  completed = 'completed',
  duplicated = 'duplicated',
  failed = 'failed',
}

export enum UploadErrorCode {
  sizeError = 'sizeError',
  formatError = 'formatError',
  formatAndSizeError = 'formatAndSizeError',
  uploadError = 'uploadError',
}

export type UploadStatusPreparing = {
  code: UploadStatusCode.preparing;
  hash: DocumentHash;
  abort: () => void;
};

// téléversement en cours
export type UploadStatusRunning = {
  code: UploadStatusCode.running;
  hash: DocumentHash;
  progress: number;
  abort: () => void;
};

// échec du téléversement
export type UploadStatusFailed = {
  code: UploadStatusCode.failed;
  error: UploadErrorCode;
};

// fichier ajouté à la bibliothèque après le téléversement
export type UploadStatusCompleted = {
  code: UploadStatusCode.completed;
  fichierId: number;
  hash: DocumentHash;
};

// fichier déjà téléversé
export type UploadStatusDuplicated = {
  code: UploadStatusCode.duplicated;
  fichierId: number;
  filename: string;
  hash: string;
};

export type UploadStatus =
  | UploadStatusPreparing
  | UploadStatusRunning
  | UploadStatusCompleted
  | UploadStatusDuplicated
  | UploadStatusFailed;

/** type des documents attendus */
export type DocType =
  | 'reglementaire'
  | 'complementaire'
  | 'annexe'
  | 'labellisation'
  | 'audit'
  | 'rapport'
  // Dossier réglementaire d'une démarche : jamais confidentiel, il est destiné
  // aux instances consultatives.
  | 'demarche_pcaet';

export type DuplicatedDocumentPreuveType = Extract<
  DocType,
  'reglementaire' | 'complementaire' | 'annexe'
>;

export type AddedDuplicatedDocument = {
  hash: string;
  preuveId: number;
  preuveType: DuplicatedDocumentPreuveType;
  storedFilenameKept: boolean;
};

export type OnDuplicatedDocumentsAdded = (
  documents: AddedDuplicatedDocument[]
) => void;
