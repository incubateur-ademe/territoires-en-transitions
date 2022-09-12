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
