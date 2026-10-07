import { describe, expect, test } from 'vitest';
import {
  buildDuplicatedDocumentInformationByKey,
  getDuplicatedDocumentKey,
  mergeDuplicatedDocumentInformationByKey,
} from './duplicated-document-state.utils';

describe('duplicated document state utils', () => {
  test('maps duplicate information to the created document identity', () => {
    const duplicatedDocumentInformationByKey =
      buildDuplicatedDocumentInformationByKey([
        {
          hash: 'same-hash',
          documentId: 2,
          preuveType: 'complementaire',
          storedFilenameKept: false,
        },
      ]);

    expect(duplicatedDocumentInformationByKey).toEqual({
      [getDuplicatedDocumentKey({ id: 2, preuveType: 'complementaire' })]: {
        storedFilenameKept: false,
      },
    });
  });

  test('keeps entries distinct when different preuve types share the same id', () => {
    const duplicatedDocumentInformationByKey =
      buildDuplicatedDocumentInformationByKey([
        {
          hash: 'hash-annexe',
          documentId: 7,
          preuveType: 'annexe',
          storedFilenameKept: false,
        },
        {
          hash: 'hash-complementaire',
          documentId: 7,
          preuveType: 'complementaire',
          storedFilenameKept: true,
        },
      ]);

    expect(duplicatedDocumentInformationByKey).toEqual({
      [getDuplicatedDocumentKey({ id: 7, preuveType: 'annexe' })]: {
        storedFilenameKept: false,
      },
      [getDuplicatedDocumentKey({ id: 7, preuveType: 'complementaire' })]: {
        storedFilenameKept: true,
      },
    });
  });

  test('keeps duplicate information from earlier submissions when merging a new batch', () => {
    const duplicatedDocumentInformationByKey =
      mergeDuplicatedDocumentInformationByKey(
        mergeDuplicatedDocumentInformationByKey({}, [
          {
            hash: 'hash-1',
            documentId: 2,
            preuveType: 'annexe',
            storedFilenameKept: false,
          },
        ]),
        [
          {
            hash: 'hash-2',
            documentId: 4,
            preuveType: 'annexe',
            storedFilenameKept: true,
          },
        ]
      );

    expect(duplicatedDocumentInformationByKey).toEqual({
      [getDuplicatedDocumentKey({ id: 2, preuveType: 'annexe' })]: {
        storedFilenameKept: false,
      },
      [getDuplicatedDocumentKey({ id: 4, preuveType: 'annexe' })]: {
        storedFilenameKept: true,
      },
    });
  });
});
