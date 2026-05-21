import { type ArchiveFolderArborescence } from '../generate-preuves-archive/generate-archive-folder-arborescence';
import { buildArchivePath } from './build-archive-path';
import { buildLiensCsv } from './build-liens-csv';

// Le dossier `_manifeste/` à la racine écarte tout risque de collision avec un
// fichier user homonyme (qui serait écrasé sans dédoublonnage côté manifestes).
const MANIFESTE_FOLDER = '_manifeste';
const FICHIERS_MANQUANTS_FILENAME = 'fichiers-manquants.txt';
const LIENS_CSV_FILENAME = 'liens.csv';

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
  const liensCsv = arborescence.linkFolders
    .filter((folder) => folder.liens.length > 0)
    .map((folder) => ({
      name: buildArchivePath([
        ...folder.folderSegments,
        LIENS_CSV_FILENAME,
      ]),
      content: buildLiensCsv(folder.liens),
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

  return [...liensCsv, ...fichiersManquants];
}
