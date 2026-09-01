import { useState } from 'react';
import type { AddedDuplicatedDocument } from './AddPreuveModal/types';
import type { PreuveType } from './Bibliotheque/types';

export type DuplicatedDocumentInformation = {
  storedFilenameKept: boolean;
};

type DuplicatedDocumentKeyFields = {
  id: number;
  preuveType: PreuveType;
};

type DuplicatedDocumentInformationByKey = Record<
  string,
  DuplicatedDocumentInformation
>;

export const getDuplicatedDocumentKey = ({
  preuveType,
  id,
}: DuplicatedDocumentKeyFields): string => `${preuveType}:${id}`;

export const buildDuplicatedDocumentInformationByKey = (
  documents: AddedDuplicatedDocument[]
): DuplicatedDocumentInformationByKey =>
  Object.fromEntries(
    documents.map(({ preuveId, preuveType, storedFilenameKept }) => [
      getDuplicatedDocumentKey({ preuveType: preuveType, id: preuveId }),
      { storedFilenameKept },
    ])
  );

export const mergeDuplicatedDocumentInformationByKey = (
  previousInformationByKey: DuplicatedDocumentInformationByKey,
  documents: AddedDuplicatedDocument[]
): DuplicatedDocumentInformationByKey => ({
  ...previousInformationByKey,
  ...buildDuplicatedDocumentInformationByKey(documents),
});

export const useDuplicatedDocumentState = () => {
  const [
    duplicatedDocumentInformationByKey,
    setDuplicatedDocumentInformationByKey,
  ] = useState<DuplicatedDocumentInformationByKey>({});

  const registerDuplicatedDocuments = (
    documents: AddedDuplicatedDocument[]
  ) => {
    setDuplicatedDocumentInformationByKey((previousInformationByKey) =>
      mergeDuplicatedDocumentInformationByKey(
        previousInformationByKey,
        documents
      )
    );
  };

  const getDuplicatedDocumentInformation = (
    preuve: DuplicatedDocumentKeyFields
  ): DuplicatedDocumentInformation | undefined =>
    duplicatedDocumentInformationByKey[getDuplicatedDocumentKey(preuve)];

  return {
    registerDuplicatedDocuments,
    getDuplicatedDocumentInformation,
  };
};
