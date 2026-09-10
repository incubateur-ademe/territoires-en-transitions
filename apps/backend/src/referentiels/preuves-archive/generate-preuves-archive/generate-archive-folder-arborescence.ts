import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ActionTypeEnum } from '@tet/domain/referentiels';
import { groupBy } from 'es-toolkit';
import type { PreuvesByOrigin } from '../collect-audit-preuves/collect-audit-preuves.service';
import {
  PreuvesArchiveErrorEnum,
  type PreuvesArchiveError,
} from '../preuves-archive.errors';
import type {
  CollectedLinkPreuve,
  MissingFilePreuve,
} from '../collect-audit-preuves/collect-preuves.repository';
import {
  checkArchiveLimits,
  type ArchiveLimitsExceeded,
} from '../build-archive/check-archive-limits';
import {
  splitTriagedArchiveFiles,
  triageArchiveFile,
} from '../build-archive/triage-archive-files';
import type {
  ArchiveFolderArborescence,
  ArchiveLinkFolder,
  SkippedFile,
} from '../build-archive/archive-arborescence.types';

const MESURES_FOLDER = 'mesures';
const CYCLE_FOLDER = 'cycle-labellisation';
const DEMANDE_FOLDER = 'demande';
const AUDIT_FOLDER = 'audit';

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

type LinkWithFolder = {
  link: CollectedLinkPreuve;
  folderSegments: string[];
};

type MissingFileWithFolder = {
  missingFile: MissingFilePreuve;
  folderSegments: string[];
};

const FILE_MISSING_FROM_STORAGE = 'Fichier introuvable dans le stockage';

function toSkippedMissingFile({
  missingFile,
  folderSegments,
}: MissingFileWithFolder): SkippedFile {
  return {
    filename: missingFile.filename ?? missingFile.hash,
    emplacement: folderSegments.join('/'),
    raison: FILE_MISSING_FROM_STORAGE,
  };
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
      mesure.actionId === actionId || actionId.startsWith(`${mesure.actionId}.`)
  );
  return match ? match.folderSegments : [MESURES_FOLDER];
}

function toLimitsExceededMessage(limitsCheck: ArchiveLimitsExceeded): string {
  if (limitsCheck.exceeded === 'fileCount') {
    return `Trop de fichiers à archiver (${limitsCheck.fileCount}, limite ${limitsCheck.limit})`;
  }
  return `Archive trop volumineuse (${limitsCheck.totalSize} octets, limite ${limitsCheck.limit})`;
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

  const mesureMissingFiles = preuves.mesure.missingFiles.map((missingFile) => ({
    missingFile,
    folderSegments: mesureFolderSegments(missingFile.actionId, mesureFolders),
  }));
  const demandeMissingFiles = preuves.demande.missingFiles.map(
    (missingFile) => ({
      missingFile,
      folderSegments: [CYCLE_FOLDER, DEMANDE_FOLDER],
    })
  );
  const auditMissingFiles = preuves.audit.missingFiles.map((missingFile) => ({
    missingFile,
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

  const { files: collectedFiles, skippedFiles: triagedSkippedFiles } =
    splitTriagedArchiveFiles(
      [...mesureFiles, ...demandeFiles, ...auditFiles].map(triageArchiveFile)
    );
  const skippedFiles = [
    ...triagedSkippedFiles,
    ...[
      ...mesureMissingFiles,
      ...demandeMissingFiles,
      ...auditMissingFiles,
    ].map(toSkippedMissingFile),
  ];

  const limitsCheck = checkArchiveLimits(collectedFiles);
  if (!limitsCheck.withinLimits) {
    return failure(
      PreuvesArchiveErrorEnum.COLLECT_PREUVES_ERROR,
      new Error(toLimitsExceededMessage(limitsCheck))
    );
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
