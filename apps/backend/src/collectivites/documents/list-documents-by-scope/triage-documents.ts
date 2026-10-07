import type { StoredDocumentHash } from '@tet/domain/collectivites';
import { ActionId } from '@tet/domain/referentiels';

export interface CollectedFile {
  bucketId: string;
  hash: StoredDocumentHash;
  filename: string | null;
  filesize: number | null;
  actionId: ActionId | null;
}

export type MissingFile = Pick<CollectedFile, 'hash' | 'filename' | 'actionId'>;

export interface CollectedLink {
  url: string;
  titre: string | null;
  commentaire: string | null;
  actionId: ActionId | null;
}

export type CollectedDocuments = {
  files: CollectedFile[];
  missingFiles: MissingFile[];
  links: CollectedLink[];
};

export type CollectedRow = Pick<CollectedFile, 'actionId' | 'filename'> & {
  fichierId: number | null;
  hash: StoredDocumentHash | null;
  url: string | null;
  titre: string | null;
  commentaire: string | null;
  fichier: {
    bucketId: string;
    filesize: number | null;
  } | null;
};

type TriagedDocument =
  | { kind: 'file'; file: CollectedFile }
  | { kind: 'missingFile'; missingFile: MissingFile }
  | { kind: 'link'; link: CollectedLink };

function triageLink(row: CollectedRow): TriagedDocument[] {
  const { url, titre, commentaire, actionId } = row;

  const hasUrl = !!url;
  if (!hasUrl) {
    return [];
  }

  return [{ kind: 'link', link: { url, titre, commentaire, actionId } }];
}

function triageDocument(row: CollectedRow): TriagedDocument[] {
  const { actionId, fichierId, hash, filename, fichier } = row;

  const isLink = fichierId === null;
  if (isLink) {
    return triageLink(row);
  }

  const belongsToAnotherCollectivite = hash === null;
  if (belongsToAnotherCollectivite) {
    return [];
  }

  const isMissingFromStorage = fichier === null;
  if (isMissingFromStorage) {
    return [{ kind: 'missingFile', missingFile: { hash, filename, actionId } }];
  }

  return [
    {
      kind: 'file',
      file: {
        bucketId: fichier.bucketId,
        filesize: fichier.filesize,
        hash,
        filename,
        actionId,
      },
    },
  ];
}

export function triageDocuments(rows: CollectedRow[]): CollectedDocuments {
  const triaged = rows.flatMap(triageDocument);

  return {
    files: triaged.flatMap((entry) =>
      entry.kind === 'file' ? [entry.file] : []
    ),
    missingFiles: triaged.flatMap((entry) =>
      entry.kind === 'missingFile' ? [entry.missingFile] : []
    ),
    links: triaged.flatMap((entry) =>
      entry.kind === 'link' ? [entry.link] : []
    ),
  };
}
