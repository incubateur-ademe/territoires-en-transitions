export type TUploader = {
  status: UploadStatus;
};

export enum UploadStatusCode {
  running = 'running',
  uploaded = 'uploaded',
  completed = 'completed',
  duplicated = 'duplicated',
  failed = 'failed',
  aborted = 'aborted',
}

export enum UploadErrorCode {
  sizeError = 'sizeError',
  formatError = 'formatError',
  formatAndSizeError = 'formatAndSizeError',
  uploadError = 'uploadError',
}

// téléversement en cours
export type UploadStatusRunning = {
  code: UploadStatusCode.running;
  progress: number;
  abort?: () => void;
};

// échec du téléversement
export type UploadStatusFailed = {
  code: UploadStatusCode.failed;
  error: UploadErrorCode;
};

// fichier téléversé
export type UploadStatusUploaded = {
  code: UploadStatusCode.uploaded;
  filename: string;
  hash: string;
};

// fichier ajouté à la bibliothèque après le téléversement
export type UploadStatusCompleted = {
  code: UploadStatusCode.completed;
  fichier_id: number;
};

// fichier déjà téléversé
export type UploadStatusDuplicated = {
  code: UploadStatusCode.duplicated;
  fichier_id: number;
  filename: string;
};

// téléversement interrompu par l'utilisateur
type UploadStatusAborted = {code: UploadStatusCode.aborted};

export type UploadStatus =
  | UploadStatusRunning
  | UploadStatusUploaded
  | UploadStatusCompleted
  | UploadStatusDuplicated
  | UploadStatusFailed
  | UploadStatusAborted;
