import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ActionTypeEnum } from '@tet/domain/referentiels';
import { groupBy } from 'es-toolkit';
import type { PreuvesByOrigin } from '../list-audit-preuves/list-audit-preuves.service';
import {
  PreuvesArchiveErrorEnum,
  type PreuvesArchiveError,
} from '../preuves-archive.errors';
import type {
  CollectedFilePreuve,
  CollectedLinkPreuve,
} from '../list-audit-preuves/collect-preuves.repository';
import type { LienPreuve } from '../build-archive/build-liens-csv';

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
const MAX_FILE_COUNT = 500;
const MAX_TOTAL_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

const MESURES_FOLDER = 'mesures';
const CYCLE_FOLDER = 'cycle-labellisation';
const DEMANDE_FOLDER = 'demande';
const AUDIT_FOLDER = 'audit';

export interface ArchiveFile {
  folderSegments: string[];
  filename: string;
  bucketId: string;
  hash: string;
  filesize: number;
}

export interface ArchiveLinkFolder {
  folderSegments: string[];
  liens: LienPreuve[];
}

export interface SkippedFile {
  filename: string;
  emplacement: string;
  raison: string;
}

export interface ArchiveFolderArborescence {
  files: ArchiveFile[];
  linkFolders: ArchiveLinkFolder[];
  skippedFiles: SkippedFile[];
}

export interface ReferentielTreeNode {
  actionId: string;
  actionType?: string;
  identifiant?: string | null;
  nom?: string | null;
  actionsEnfant?: ReferentielTreeNode[];
}

export interface GenerateArchiveFolderArborescenceInput {
  preuves: PreuvesByOrigin;
  referentielTree: ReferentielTreeNode;
}

interface MesureFolder {
  actionId: string;
  folderSegments: string[];
}

type FileWithFolder = {
  file: CollectedFilePreuve;
  folderSegments: string[];
};

type LinkWithFolder = {
  link: CollectedLinkPreuve;
  folderSegments: string[];
};

type FileTriage =
  | { kind: 'collected'; file: ArchiveFile }
  | { kind: 'skipped'; entry: SkippedFile };

function triageFile({ file, folderSegments }: FileWithFolder): FileTriage {
  const emplacement = folderSegments.join('/');
  const filename = file.filename ?? file.hash;

  if (file.filesize === null || file.bucketId === null) {
    return {
      kind: 'skipped',
      entry: {
        filename,
        emplacement,
        raison: 'Fichier introuvable dans le stockage',
      },
    };
  }

  if (file.filesize > MAX_FILE_SIZE_BYTES) {
    return {
      kind: 'skipped',
      entry: {
        filename,
        emplacement,
        raison: `Fichier trop volumineux (${file.filesize} octets, limite ${MAX_FILE_SIZE_BYTES})`,
      },
    };
  }

  return {
    kind: 'collected',
    file: {
      folderSegments,
      filename,
      bucketId: file.bucketId,
      hash: file.hash,
      filesize: file.filesize,
    },
  };
}

function checkArchiveLimits(
  files: ArchiveFile[]
): Result<undefined, PreuvesArchiveError> {
  if (files.length > MAX_FILE_COUNT) {
    return failure(
      PreuvesArchiveErrorEnum.COLLECT_PREUVES_ERROR,
      new Error(
        `Trop de fichiers à archiver (${files.length}, limite ${MAX_FILE_COUNT})`
      )
    );
  }

  const totalSize = files.reduce((sum, file) => sum + file.filesize, 0);
  if (totalSize > MAX_TOTAL_SIZE_BYTES) {
    return failure(
      PreuvesArchiveErrorEnum.COLLECT_PREUVES_ERROR,
      new Error(
        `Archive trop volumineuse (${totalSize} octets, limite ${MAX_TOTAL_SIZE_BYTES})`
      )
    );
  }

  return success(undefined);
}

function groupLinksByFolder(links: LinkWithFolder[]): ArchiveLinkFolder[] {
  const grouped = groupBy(links, ({ folderSegments }) =>
    folderSegments.join('/')
  );
  return Object.values(grouped).map((items) => ({
    folderSegments: items[0].folderSegments,
    liens: items.map(({ link }) => ({
      titre: link.titre ?? '',
      url: link.url,
      commentaire: link.commentaire ?? '',
    })),
  }));
}

function nodeLabel(node: ReferentielTreeNode): string {
  return [node.identifiant, node.nom]
    .filter((part): part is string => Boolean(part))
    .join(' ');
}

function collectMesureFolders(
  node: ReferentielTreeNode,
  ancestors: string[]
): MesureFolder[] {
  const path =
    node.actionType === ActionTypeEnum.REFERENTIEL
      ? ancestors
      : [...ancestors, nodeLabel(node)];

  if (node.actionType === ActionTypeEnum.ACTION) {
    return [
      { actionId: node.actionId, folderSegments: [MESURES_FOLDER, ...path] },
    ];
  }

  return (node.actionsEnfant ?? []).flatMap((child) =>
    collectMesureFolders(child, path)
  );
}

function mesureFolderSegments(
  actionId: string | null,
  mesureFolders: MesureFolder[]
): string[] {
  if (actionId === null) {
    return [MESURES_FOLDER];
  }
  const match = mesureFolders.find(
    (mesure) =>
      mesure.actionId === actionId ||
      actionId.startsWith(`${mesure.actionId}.`)
  );
  return match ? match.folderSegments : [MESURES_FOLDER];
}

export function generateArchiveFolderArborescence(
  input: GenerateArchiveFolderArborescenceInput
): Result<ArchiveFolderArborescence, PreuvesArchiveError> {
  const { preuves, referentielTree } = input;

  const mesureFolders = collectMesureFolders(referentielTree, []);

  const mesureFiles = preuves.mesure.files.map((file) => ({
    file,
    folderSegments: mesureFolderSegments(file.actionId, mesureFolders),
  }));
  const demandeFiles = preuves.demande.files.map((file) => ({
    file,
    folderSegments: [CYCLE_FOLDER, DEMANDE_FOLDER],
  }));
  const auditFiles = preuves.audit.files.map((file) => ({
    file,
    folderSegments: [CYCLE_FOLDER, AUDIT_FOLDER],
  }));

  const mesureLinks = preuves.mesure.links.map((link) => ({
    link,
    folderSegments: mesureFolderSegments(link.actionId, mesureFolders),
  }));
  const demandeLinks = preuves.demande.links.map((link) => ({
    link,
    folderSegments: [CYCLE_FOLDER, DEMANDE_FOLDER],
  }));
  const auditLinks = preuves.audit.links.map((link) => ({
    link,
    folderSegments: [CYCLE_FOLDER, AUDIT_FOLDER],
  }));

  const triaged = [...mesureFiles, ...demandeFiles, ...auditFiles].map(triageFile);
  const collectedFiles = triaged.flatMap((entry) =>
    entry.kind === 'collected' ? [entry.file] : []
  );
  const skippedFiles = triaged.flatMap((entry) =>
    entry.kind === 'skipped' ? [entry.entry] : []
  );

  const limits = checkArchiveLimits(collectedFiles);
  if (!limits.success) {
    return limits;
  }

  return success({
    files: collectedFiles,
    linkFolders: groupLinksByFolder([
      ...mesureLinks,
      ...demandeLinks,
      ...auditLinks,
    ]),
    skippedFiles,
  });
}
