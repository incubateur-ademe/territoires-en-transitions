export type TUploader = {
  status: UploadStatus;
};

export enum UploadStatusCode {
  running = 'running',
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

export type UploadStatusRunning = {
  code: UploadStatusCode.running;
  progress: number;
  abort?: () => void;
};

export type UploadStatusFailed = {
  code: UploadStatusCode.failed;
  error: UploadErrorCode;
};

type UploadStatusCompleted = {code: UploadStatusCode.completed};

type UploadStatusAborted = {code: UploadStatusCode.aborted};

export type UploadStatus =
  | UploadStatusRunning
  | UploadStatusCompleted
  | UploadStatusFailed
  | UploadStatusAborted;

export type Doc = DocFile | DocLink;
export type DocFile = {
  type: 'fichier';
  filename: string;
  bucket_id: string;
  path: string;
  commentaire: string;
};
export type DocLink = {
  type: 'lien';
  url: string;
  titre: string;
  commentaire: string;
};

export type TEditHandlers = {
  remove: () => void;
  update: () => void;
  isEditingComment: boolean;
  setEditingComment: (editing: boolean) => void;
  updatedComment: string;
  setUpdatedComment: (comment: string) => void;
};
