import type { ArchiveFolderArborescence } from '@tet/backend/utils/archive/archive-arborescence.types';
import {
  splitTriagedArchiveFiles,
  triageArchiveFile,
} from '@tet/backend/utils/archive/triage-archive-files.utils';
import type {
  DemarcheDocumentFichier,
  DemarcheDocumentsSnapshot,
} from '@tet/domain/demarches';

/**
 * Les pièces que l'instructeur lit : le dossier tel qu'il a été transmis,
 * pièces attendues puis pièces libres, dans l'ordre du modèle. C'est ce que
 * montre l'écran d'instruction, rien de plus.
 *
 * Chaque fichier est préfixé du nom de sa pièce : hors de l'écran, « v3.pdf »
 * ne dit plus si c'est le diagnostic ou la stratégie.
 */
export const toDossierArchiveArborescence = (
  snapshot: DemarcheDocumentsSnapshot
): ArchiveFolderArborescence => {
  const ordreDe = new Map(
    snapshot.definitions.map((definition) => [definition.id, definition.ordre])
  );
  const nomDe = new Map(
    snapshot.definitions.map((definition) => [definition.id, definition.nom])
  );

  const pieces = snapshot.documents
    .filter((document) => document.etape === 'amont')
    .sort(
      (a, b) =>
        (ordreDe.get(a.documentId) ?? Number.MAX_SAFE_INTEGER) -
        (ordreDe.get(b.documentId) ?? Number.MAX_SAFE_INTEGER)
    )
    .map((document) => ({
      nom: nomDe.get(document.documentId),
      fichier: document.fichier,
    }));

  const piecesLibres = snapshot.documentsAdditional
    .filter((document) => document.etape === 'amont')
    .map((document) => ({ nom: document.titre, fichier: document.fichier }));

  const triaged = [...pieces, ...piecesLibres].flatMap(({ nom, fichier }) =>
    fichier?.bucketId
      ? [toTriagedFile(nom, { ...fichier, bucketId: fichier.bucketId })]
      : []
  );

  return { ...splitTriagedArchiveFiles(triaged), linkFolders: [] };
};

const toTriagedFile = (
  nom: string | undefined,
  fichier: DemarcheDocumentFichier & { bucketId: string }
) =>
  triageArchiveFile({
    file: {
      bucketId: fichier.bucketId,
      hash: fichier.hash,
      filename: nom?.trim()
        ? `${nom.trim()} - ${fichier.filename}`
        : fichier.filename,
      filesize: fichier.filesize,
    },
    folderSegments: [],
  });

export const toDossierArchiveFilename = (collectiviteNom: string): string =>
  `Dossier PCAET - ${collectiviteNom}.zip`;
