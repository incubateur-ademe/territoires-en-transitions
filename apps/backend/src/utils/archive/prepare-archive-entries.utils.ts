import type { ArchiveFile } from './archive-arborescence.types';
import { buildArchivePath } from './build-archive-path.utils';

// L'extracteur ZIP de Windows refuse les chemins de plus de ~260 caractères,
// dossier d'extraction compris : on borne le nom choisi par l'utilisateur.
export const MAX_FILENAME_LENGTH = 80;
const MAX_KEPT_EXTENSION_LENGTH = 10;

export interface PreparedFileEntry {
  entryPath: string;
  bucketId: string;
  hash: string;
  filename: string;
  emplacement: string;
}

export function prepareArchiveEntries(
  files: ArchiveFile[],
  reservedPaths: string[]
): PreparedFileEntry[] {
  const takenPaths = new Set<string>(reservedPaths);

  return files.map((file, index) => {
    const entryPath = toFreeEntryPath(file, index, takenPaths);
    takenPaths.add(entryPath);

    return {
      entryPath,
      bucketId: file.bucketId,
      hash: file.hash,
      filename: file.filename,
      emplacement: file.folderSegments.join('/'),
    };
  });
}

function toFreeEntryPath(
  file: ArchiveFile,
  index: number,
  takenPaths: ReadonlySet<string>
): string {
  const filename = truncateFilename(file.filename);
  const basePath = buildArchivePath([...file.folderSegments, filename]);
  if (!takenPaths.has(basePath)) {
    return basePath;
  }

  const suffixedPaths = Array.from({ length: takenPaths.size }, (_, rank) =>
    buildArchivePath([
      ...file.folderSegments,
      suffixBasename(filename, rank + 2),
    ])
  );
  const freePath = suffixedPaths.find(
    (candidate) => !takenPaths.has(candidate)
  );
  if (freePath !== undefined) {
    return freePath;
  }

  return buildArchivePath([...file.folderSegments, `${index + 1} ${filename}`]);
}

function suffixBasename(filename: string, occurrence: number): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot <= 0) {
    return `${filename} (${occurrence})`;
  }
  const name = filename.slice(0, lastDot);
  const extension = filename.slice(lastDot);
  return `${name} (${occurrence})${extension}`;
}

function truncateFilename(filename: string): string {
  if (Array.from(filename).length <= MAX_FILENAME_LENGTH) {
    return filename;
  }
  const lastDot = filename.lastIndexOf('.');
  const extension =
    lastDot > 0 && filename.length - lastDot <= MAX_KEPT_EXTENSION_LENGTH
      ? filename.slice(lastDot)
      : '';
  const name = filename.slice(0, filename.length - extension.length);
  return (
    Array.from(name)
      .slice(0, MAX_FILENAME_LENGTH - extension.length)
      .join('')
      .trimEnd() + extension
  );
}
