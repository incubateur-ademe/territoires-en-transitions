import type { ArchiveFile } from '../generate-preuves-archive/generate-archive-folder-arborescence';
import { buildArchivePath } from './build-archive-path';

export interface PreparedFileEntry {
  entryPath: string;
  bucketId: string;
  hash: string;
  filename: string;
  emplacement: string;
}

export function prepareArchiveEntries(
  files: ArchiveFile[]
): PreparedFileEntry[] {
  const seenPaths = new Map<string, number>();

  return files.map((file) => {
    const basePath = buildArchivePath([...file.folderSegments, file.filename]);
    const occurrence = seenPaths.get(basePath) ?? 0;
    seenPaths.set(basePath, occurrence + 1);

    const entryPath =
      occurrence === 0
        ? basePath
        : buildArchivePath([
            ...file.folderSegments,
            suffixBasename(file.filename, occurrence + 1),
          ]);

    return {
      entryPath,
      bucketId: file.bucketId,
      hash: file.hash,
      filename: file.filename,
      emplacement: file.folderSegments.join('/'),
    };
  });
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
