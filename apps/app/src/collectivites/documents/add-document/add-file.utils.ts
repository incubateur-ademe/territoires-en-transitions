import { FileUploadItem } from './file-item';
import {
  AddedDuplicatedDocument,
  DuplicatedPreuveType,
  isUploadInFlight,
  UploadStatusCode,
  UploadStatusDuplicated,
  ValidUploadStatus,
} from './types';

export type AddedDocumentResult = {
  documentId: number;
};

export type ValidFileItem = FileUploadItem & {
  status: ValidUploadStatus;
};

export type SubmittedValidFile = {
  file: File;
  status: ValidUploadStatus;
  addedDocument: AddedDocumentResult | void;
};

type AddedDuplicate = SubmittedValidFile & {
  status: UploadStatusDuplicated;
  addedDocument: AddedDocumentResult;
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
  Boolean(submittedFile.addedDocument);

const toDuplicatedDocument = (
  { addedDocument, file, status }: AddedDuplicate,
  preuveType: DuplicatedPreuveType
): AddedDuplicatedDocument => ({
  hash: status.hash,
  documentId: addedDocument.documentId,
  preuveType,
  storedFilenameKept: file.name !== status.filename,
});

export const buildDuplicatedDocuments = (
  submittedFiles: SubmittedValidFile[],
  preuveType: DuplicatedPreuveType
): AddedDuplicatedDocument[] =>
  submittedFiles
    .filter(isAddedDuplicate)
    .map((submittedFile) => toDuplicatedDocument(submittedFile, preuveType));
