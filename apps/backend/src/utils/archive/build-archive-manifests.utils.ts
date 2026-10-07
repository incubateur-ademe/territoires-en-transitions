import {
  type ArchiveFolderArborescence,
  type ArchiveLinkFolder,
  type SkippedFile,
} from './archive-arborescence.types';
import { buildArchivePath } from './build-archive-path.utils';
import { buildLinksCsv } from './build-links-csv.utils';

// Aucun manifeste ne peut être écrasé par un fichier user homonyme :
// `fichiers-manquants.txt` parce qu'il vit sous `_manifeste/` à la racine,
// `liens.csv` parce que `listLinksCsvPaths` réserve son chemin.
const MANIFESTE_FOLDER = '_manifeste';
const FICHIERS_MANQUANTS_FILENAME = 'fichiers-manquants.txt';
const LINKS_CSV_FILENAME = 'liens.csv';

export interface ArchiveManifestEntry {
  name: string;
  content: string;
}

export interface BuildArchiveManifestsInput {
  arborescence: ArchiveFolderArborescence;
  failedDownloads: SkippedFile[];
}

const CONTROL_AND_SEPARATOR_CHARACTERS = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;

function toSingleLine(value: string): string {
  return value.replace(CONTROL_AND_SEPARATOR_CHARACTERS, ' ').trim();
}

function toSkippedFileLine({
  emplacement,
  filename,
  raison,
}: SkippedFile): string {
  return `${toSingleLine(emplacement)}/${toSingleLine(
    filename
  )} — ${toSingleLine(raison)}`;
}

function toNonEmptyLinkFolders(
  arborescence: ArchiveFolderArborescence
): ArchiveLinkFolder[] {
  return arborescence.linkFolders.filter((folder) => folder.links.length > 0);
}

function toLinksCsvPath(folder: ArchiveLinkFolder): string {
  return buildArchivePath([...folder.folderSegments, LINKS_CSV_FILENAME]);
}

export function listLinksCsvPaths(
  arborescence: ArchiveFolderArborescence
): string[] {
  return toNonEmptyLinkFolders(arborescence).map(toLinksCsvPath);
}

export function buildArchiveManifests({
  arborescence,
  failedDownloads,
}: BuildArchiveManifestsInput): ArchiveManifestEntry[] {
  const linksCsv = toNonEmptyLinkFolders(arborescence).map((folder) => ({
    name: toLinksCsvPath(folder),
    content: buildLinksCsv(folder.links),
  }));

  const fichiersManquantsLignes = [
    ...arborescence.skippedFiles,
    ...failedDownloads,
  ].map(toSkippedFileLine);
  const fichiersManquants: ArchiveManifestEntry[] =
    fichiersManquantsLignes.length > 0
      ? [
          {
            name: buildArchivePath([
              MANIFESTE_FOLDER,
              FICHIERS_MANQUANTS_FILENAME,
            ]),
            content: `${fichiersManquantsLignes.join('\n')}\n`,
          },
        ]
      : [];

  return [...linksCsv, ...fichiersManquants];
}
