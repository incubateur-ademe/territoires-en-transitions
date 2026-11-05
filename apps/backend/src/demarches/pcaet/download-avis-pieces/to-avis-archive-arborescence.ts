import type { ArchiveFolderArborescence } from '@tet/backend/utils/archive/archive-arborescence.types';
import {
  splitTriagedArchiveFiles,
  triageArchiveFile,
} from '@tet/backend/utils/archive/triage-archive-files.utils';
import type { AvisPiece } from '../shared/list-avis-pieces.service';

/** Les pièces d'un avis à plat, dans l'ordre du dépôt. */
export const toAvisArchiveArborescence = (
  pieces: AvisPiece[]
): ArchiveFolderArborescence => {
  const triaged = pieces.flatMap(({ bucketId, hash, filename, filesize }) =>
    bucketId
      ? [
          triageArchiveFile({
            file: { bucketId, hash, filename, filesize },
            folderSegments: [],
          }),
        ]
      : []
  );
  return { ...splitTriagedArchiveFiles(triaged), linkFolders: [] };
};

export const toAvisArchiveFilename = ({
  emetteurNom,
  deposanteNom,
}: {
  emetteurNom: string;
  deposanteNom: string;
}): string => `Avis ${emetteurNom} - PCAET ${deposanteNom}.zip`;
