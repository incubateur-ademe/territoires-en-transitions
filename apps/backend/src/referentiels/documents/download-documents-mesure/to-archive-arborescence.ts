import {
  getIdentifiantFromActionId,
  tryGetReferentielIdFromActionId,
  type ActionId,
} from '@tet/domain/referentiels';
import { uniqBy } from 'es-toolkit';
import {
  splitTriagedArchiveFiles,
  triageArchiveFile,
} from '../../preuves-archive/build-archive/archive-limits';
import type { ArchiveFolderArborescence } from '../../preuves-archive/build-archive/archive-arborescence';
import type { ListDocumentsMesureOutput } from '../list-documents-mesure/list-documents-mesure.output';

export const toArchiveArborescence = (
  documents: ListDocumentsMesureOutput
): ArchiveFolderArborescence => {
  const fichiers = [
    ...documents.attendus.flatMap((attendu) => attendu.documents),
    ...documents.complementaires,
  ].flatMap((document) => (document.fichier ? [document.fichier] : []));

  const triaged = uniqBy(fichiers, ({ hash }) => hash).map((fichier) =>
    triageArchiveFile({
      file: { ...fichier, filesize: fichier.filesize ?? null },
      folderSegments: [],
    })
  );

  return { ...splitTriagedArchiveFiles(triaged), linkFolders: [] };
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
