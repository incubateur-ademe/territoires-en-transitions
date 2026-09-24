import type { ArchiveFile } from './archive-arborescence.types';
import { buildArchivePath } from './build-archive-path.utils';

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
  const basePath = buildArchivePath([...file.folderSegments, file.filename]);
  if (!takenPaths.has(basePath)) {
    return basePath;
  }

  const suffixedPaths = Array.from({ length: takenPaths.size }, (_, rank) =>
    buildArchivePath([
      ...file.folderSegments,
      suffixBasename(file.filename, rank + 2),
    ])
  );
  const freePath = suffixedPaths.find(
    (candidate) => !takenPaths.has(candidate)
  );
  if (freePath !== undefined) {
    return freePath;
  }

  return buildArchivePath([
    ...file.folderSegments,
    `${index + 1} ${file.filename}`,
  ]);
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
