export type TUploader = {
  status: UploadStatus;
};

export enum UploadStatusCode {
  running = 'running',
  uploaded = 'uploaded',
  completed = 'completed',
  failed = 'failed',
  aborted = 'aborted',
}

export enum UploadErrorCode {
  sizeError = 'sizeError',
  formatError = 'formatError',
  formatAndSizeError = 'formatAndSizeError',
  duplicateError = 'duplicateError',
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
  hash?: string;
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

// téléversement interrompu par l'utilisateur
type UploadStatusAborted = {code: UploadStatusCode.aborted};

export type UploadStatus =
  | UploadStatusRunning
  | UploadStatusUploaded
  | UploadStatusCompleted
  | UploadStatusFailed
  | UploadStatusAborted;
