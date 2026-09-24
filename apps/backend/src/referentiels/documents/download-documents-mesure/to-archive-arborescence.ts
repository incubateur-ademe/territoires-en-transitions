import type { CollectedDocuments } from '@tet/backend/collectivites/documents/list-documents-by-scope/triage-documents';
import type { ArchiveFolderArborescence } from '@tet/backend/utils/archive/archive-arborescence.types';
import {
  splitTriagedArchiveFiles,
  triageArchiveFile,
} from '@tet/backend/utils/archive/triage-archive-files.utils';
import {
  getIdentifiantFromActionId,
  type ActionId,
  type ReferentielId,
} from '@tet/domain/referentiels';
import { uniqBy } from 'es-toolkit';

export const toArchiveArborescence = (
  documents: CollectedDocuments
): ArchiveFolderArborescence => {
  const triaged = uniqBy(documents.files, ({ hash }) => hash).map((file) =>
    triageArchiveFile({ file, folderSegments: [] })
  );

  return { ...splitTriagedArchiveFiles(triaged), linkFolders: [] };
};

export const toArchiveFilename = ({
  referentielId,
  actionId,
  collectiviteNom,
}: {
  referentielId: ReferentielId;
  actionId: ActionId;
  collectiviteNom: string;
}): string =>
  `${referentielId}_${getIdentifiantFromActionId(
    actionId
  )}_${collectiviteNom}.zip`;
