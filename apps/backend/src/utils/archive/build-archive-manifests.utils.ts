import { type ArchiveFolderArborescence } from './archive-arborescence.types';
import { buildArchivePath } from './build-archive-path.utils';
import { buildLinksCsv } from './build-links-csv.utils';

// Le dossier `_manifeste/` à la racine écarte tout risque de collision avec un
// fichier user homonyme (qui serait écrasé sans dédoublonnage côté manifestes).
const MANIFESTE_FOLDER = '_manifeste';
const FICHIERS_MANQUANTS_FILENAME = 'fichiers-manquants.txt';
const LINKS_CSV_FILENAME = 'liens.csv';

export interface ArchiveManifestEntry {
  name: string;
  content: string;
}

export interface BuildArchiveManifestsInput {
  arborescence: ArchiveFolderArborescence;
  failedDownloads: string[];
}

export function buildArchiveManifests({
  arborescence,
  failedDownloads,
}: BuildArchiveManifestsInput): ArchiveManifestEntry[] {
  const linksCsv = arborescence.linkFolders
    .filter((folder) => folder.links.length > 0)
    .map((folder) => ({
      name: buildArchivePath([...folder.folderSegments, LINKS_CSV_FILENAME]),
      content: buildLinksCsv(folder.links),
    }));

  const fichiersManquantsLignes = [
    ...arborescence.skippedFiles.map(
      (skipped) =>
        `${skipped.emplacement}/${skipped.filename} — ${skipped.raison}`
    ),
    ...failedDownloads,
  ];
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
