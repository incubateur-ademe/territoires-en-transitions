import { FileUploadItem } from './file-item';
import {
  AddedDuplicatedDocument,
  DuplicatedDocumentPreuveType,
  isUploadInFlight,
  UploadStatusCode,
  UploadStatusDuplicated,
  ValidUploadStatus,
} from './types';

export type AddedPreuveResult = {
  preuveId: number;
};

export type ValidFileItem = FileUploadItem & {
  status: ValidUploadStatus;
};

export type SubmittedValidFile = {
  file: File;
  status: ValidUploadStatus;
  addedPreuve: AddedPreuveResult | void;
};

type AddedDuplicate = SubmittedValidFile & {
  status: UploadStatusDuplicated;
  addedPreuve: AddedPreuveResult;
};

export type FilesSubmission =
  | { canSubmit: true; validFiles: ValidFileItem[] }
  | { canSubmit: false; reason: 'uploadInFlight' | 'noValidFile' };

const isValidFileItem = (item: FileUploadItem): item is ValidFileItem =>
  item.status.code === UploadStatusCode.completed ||
  item.status.code === UploadStatusCode.duplicated;

export const getFilesSubmission = (
  items: FileUploadItem[]
): FilesSubmission => {
  if (items.some(({ status }) => isUploadInFlight(status))) {
    return { canSubmit: false, reason: 'uploadInFlight' };
  }

  const validFiles = items.filter(isValidFileItem);

  if (validFiles.length === 0) {
    return { canSubmit: false, reason: 'noValidFile' };
  }

  return { canSubmit: true, validFiles };
};

const isAddedDuplicate = (
  submittedFile: SubmittedValidFile
): submittedFile is AddedDuplicate =>
  submittedFile.status.code === UploadStatusCode.duplicated &&
  Boolean(submittedFile.addedPreuve);

const toDuplicatedDocument = (
  { addedPreuve, file, status }: AddedDuplicate,
  preuveType: DuplicatedDocumentPreuveType
): AddedDuplicatedDocument => ({
  hash: status.hash,
  preuveId: addedPreuve.preuveId,
  preuveType,
  storedFilenameKept: file.name !== status.filename,
});

export const buildDuplicatedDocuments = (
  submittedFiles: SubmittedValidFile[],
  preuveType: DuplicatedDocumentPreuveType
): AddedDuplicatedDocument[] =>
  submittedFiles
    .filter(isAddedDuplicate)
    .map((submittedFile) => toDuplicatedDocument(submittedFile, preuveType));
