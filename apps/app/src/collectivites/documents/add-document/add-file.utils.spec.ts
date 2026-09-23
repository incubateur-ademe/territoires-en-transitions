import { toDocumentHash } from '@tet/domain/collectivites';
import { describe, expect, it } from 'vitest';
import {
  AddedDocumentResult,
  buildDuplicatedDocuments,
  getFilesSubmission,
  SubmittedValidFile,
} from './add-file.utils';
import { FileUploadItem } from './file-item';
import { UploadErrorCode, UploadStatusCode } from './types';

const HASH = toDocumentHash('a'.repeat(64));

const toFile = (name: string): File =>
  new File([''], name, { type: 'application/pdf' });

const toCompletedItem = (id: string): FileUploadItem => ({
  id,
  file: toFile(`${id}.pdf`),
  status: { code: UploadStatusCode.completed, fichierId: 1, hash: HASH },
});

const toDuplicatedItem = (id: string): FileUploadItem => ({
  id,
  file: toFile(`${id}.pdf`),
  status: {
    code: UploadStatusCode.duplicated,
    fichierId: 2,
    filename: `${id}-stocke.pdf`,
    hash: HASH,
  },
});

const toPreparingItem = (id: string): FileUploadItem => ({
  id,
  file: toFile(`${id}.pdf`),
  status: {
    code: UploadStatusCode.preparing,
    hash: HASH,
    abort: () => undefined,
  },
});

const toRunningItem = (id: string): FileUploadItem => ({
  id,
  file: toFile(`${id}.pdf`),
  status: {
    code: UploadStatusCode.running,
    hash: HASH,
    progress: 50,
    abort: () => undefined,
  },
});

const toFailedItem = (id: string): FileUploadItem => ({
  id,
  file: toFile(`${id}.pdf`),
  status: {
    code: UploadStatusCode.failed,
    error: UploadErrorCode.sizeError,
  },
});

describe('getFilesSubmission', () => {
  it("refuse l'ajout quand la sélection est vide", () => {
    expect(getFilesSubmission([])).toEqual({
      canSubmit: false,
      reason: 'noValidFile',
    });
  });

  it("refuse l'ajout quand la sélection ne contient que des fichiers en échec", () => {
    expect(getFilesSubmission([toFailedItem('item-1')])).toEqual({
      canSubmit: false,
      reason: 'noValidFile',
    });
  });

  it("refuse l'ajout tant qu'un fichier est en préparation, même si un autre est valide", () => {
    expect(
      getFilesSubmission([
        toDuplicatedItem('item-1'),
        toPreparingItem('item-2'),
      ])
    ).toEqual({ canSubmit: false, reason: 'uploadInFlight' });
  });

  it("refuse l'ajout tant qu'un upload est en cours, même si un autre est valide", () => {
    expect(
      getFilesSubmission([toCompletedItem('item-1'), toRunningItem('item-2')])
    ).toEqual({ canSubmit: false, reason: 'uploadInFlight' });
  });

  it("autorise l'ajout et ne retient que les fichiers complétés et dupliqués", () => {
    const completedItem = toCompletedItem('item-1');
    const duplicatedItem = toDuplicatedItem('item-2');

    expect(
      getFilesSubmission([
        completedItem,
        toFailedItem('item-3'),
        duplicatedItem,
      ])
    ).toEqual({ canSubmit: true, validFiles: [completedItem, duplicatedItem] });
  });
});

const toDuplicatedSubmission = ({
  depositedFilename,
  storedFilename,
  addedDocument,
}: {
  depositedFilename: string;
  storedFilename: string;
  addedDocument: AddedDocumentResult | void;
}): SubmittedValidFile => ({
  file: toFile(depositedFilename),
  status: {
    code: UploadStatusCode.duplicated,
    fichierId: 2,
    filename: storedFilename,
    hash: HASH,
  },
  addedDocument,
});

const toCompletedSubmission = (filename: string): SubmittedValidFile => ({
  file: toFile(filename),
  status: { code: UploadStatusCode.completed, fichierId: 1, hash: HASH },
  addedDocument: { documentId: 43 },
});

describe('buildDuplicatedDocuments', () => {
  it('garde le nom déjà stocké quand le fichier déposé en porte un autre', () => {
    expect(
      buildDuplicatedDocuments(
        [
          toDuplicatedSubmission({
            depositedFilename: 'nouveau nom.pdf',
            storedFilename: 'nom-original.pdf',
            addedDocument: { documentId: 42 },
          }),
        ],
        'annexe'
      )
    ).toEqual([
      {
        hash: HASH,
        documentId: 42,
        preuveType: 'annexe',
        storedFilenameKept: true,
      },
    ]);
  });

  it('ne garde pas le nom stocké quand le fichier déposé porte déjà ce nom', () => {
    expect(
      buildDuplicatedDocuments(
        [
          toDuplicatedSubmission({
            depositedFilename: 'nom-original.pdf',
            storedFilename: 'nom-original.pdf',
            addedDocument: { documentId: 42 },
          }),
        ],
        'reglementaire'
      )
    ).toEqual([
      {
        hash: HASH,
        documentId: 42,
        preuveType: 'reglementaire',
        storedFilenameKept: false,
      },
    ]);
  });

  it('écarte les fichiers complétés, qui ne sont pas des doublons', () => {
    expect(
      buildDuplicatedDocuments([toCompletedSubmission('nouveau.pdf')], 'annexe')
    ).toEqual([]);
  });

  it("écarte les doublons dont l'ajout de document n'a rien rendu", () => {
    expect(
      buildDuplicatedDocuments(
        [
          toDuplicatedSubmission({
            depositedFilename: 'nouveau nom.pdf',
            storedFilename: 'nom-original.pdf',
            addedDocument: undefined,
          }),
        ],
        'complementaire'
      )
    ).toEqual([]);
  });
});
