import {
  getIdentifiantFromActionId,
  tryGetReferentielIdFromActionId,
  type ActionId,
} from '@tet/domain/referentiels';
import { uniqBy } from 'es-toolkit';
import type { ArchiveFile } from '../../preuves-archive/generate-preuves-archive/generate-archive-folder-arborescence';
import type { ListDocumentsMesureOutput } from '../list-documents-mesure/list-documents-mesure.output';

const UNKNOWN_FILESIZE = 0;

export const toArchiveFiles = (
  documents: ListDocumentsMesureOutput
): ArchiveFile[] => {
  const fichiers = [
    ...documents.attendus.flatMap((attendu) => attendu.documents),
    ...documents.complementaires,
  ].flatMap((document) => (document.fichier ? [document.fichier] : []));

  return uniqBy(fichiers, ({ hash }) => hash).map(
    ({ hash, filename, bucketId, filesize }) => ({
      folderSegments: [],
      filename,
      bucketId,
      hash,
      filesize: filesize ?? UNKNOWN_FILESIZE,
    })
  );
};

export const toArchiveFilename = ({
  actionId,
  collectiviteNom,
}: {
  actionId: ActionId;
  collectiviteNom: string;
}): string => {
  const referentielId = tryGetReferentielIdFromActionId(actionId);
  const identifiant = getIdentifiantFromActionId(actionId);
  const prefix = [referentielId, identifiant].filter(Boolean).join('_');
  return `${prefix || actionId}_${collectiviteNom}.zip`;
};
