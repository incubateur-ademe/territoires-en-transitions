import { failure, Result, success } from '@tet/backend/utils/result.type';

const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_ENTRY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_BYTES = 22;
const CENTRAL_DIRECTORY_ENTRY_HEADER_BYTES = 46;
const MAX_ZIP_COMMENT_BYTES = 65535;
const MAX_ENTRY_COUNT = 4096;
const ZIP64_MARKER = 0xffffffff;

export type OoxmlKind = 'xlsx' | 'docx';

export type OoxmlArchiveError =
  | { kind: 'not_ooxml' }
  | { kind: 'uncompressed_too_large'; declaredBytes: number };

/** Ce qu'une archive ZIP est, d'après son répertoire : un classeur, un document Word, ou ni l'un ni l'autre. */
export const inspectOoxmlKind = (buffer: Buffer): OoxmlKind | null => {
  const entries = readCentralDirectoryEntries(buffer);
  if (entries === null) {
    return null;
  }
  return ooxmlKindOf(entries);
};

export const validateOoxmlArchive = (
  buffer: Buffer,
  maxUncompressedBytes: number
): Result<{ kind: OoxmlKind }, OoxmlArchiveError> => {
  const entries = readCentralDirectoryEntries(buffer);
  const kind = entries === null ? null : ooxmlKindOf(entries);
  if (entries === null || kind === null) {
    return failure({ kind: 'not_ooxml' });
  }

  const declaredBytes = entries.reduce(
    (total, entry) => total + entry.uncompressedBytes,
    0
  );
  if (declaredBytes > maxUncompressedBytes) {
    return failure({ kind: 'uncompressed_too_large', declaredBytes });
  }

  return success({ kind });
};

type ZipEntry = { name: string; uncompressedBytes: number };

const ooxmlKindOf = (entries: ZipEntry[]): OoxmlKind | null => {
  if (!entries.some((entry) => entry.name === '[Content_Types].xml')) {
    return null;
  }
  if (entries.some((entry) => entry.name.startsWith('xl/'))) {
    return 'xlsx';
  }
  if (entries.some((entry) => entry.name === 'word/document.xml')) {
    return 'docx';
  }
  return null;
};

const readCentralDirectoryEntries = (buffer: Buffer): ZipEntry[] | null => {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  if (eocdOffset === null) {
    return null;
  }

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const directoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  if (entryCount > MAX_ENTRY_COUNT || directoryOffset === ZIP64_MARKER) {
    return null;
  }

  return readEntriesFrom(buffer, directoryOffset, entryCount);
};

const readEntriesFrom = (
  buffer: Buffer,
  offset: number,
  remaining: number
): ZipEntry[] | null => {
  if (remaining === 0) {
    return [];
  }
  const entry = readCentralDirectoryEntry(buffer, offset);
  if (entry === null) {
    return null;
  }
  const rest = readEntriesFrom(buffer, entry.nextOffset, remaining - 1);
  return rest === null ? null : [entry.value, ...rest];
};

const readCentralDirectoryEntry = (
  buffer: Buffer,
  offset: number
): { value: ZipEntry; nextOffset: number } | null => {
  if (offset + CENTRAL_DIRECTORY_ENTRY_HEADER_BYTES > buffer.length) {
    return null;
  }
  if (buffer.readUInt32LE(offset) !== CENTRAL_DIRECTORY_ENTRY_SIGNATURE) {
    return null;
  }

  const uncompressedBytes = buffer.readUInt32LE(offset + 24);
  if (uncompressedBytes === ZIP64_MARKER) {
    return null;
  }

  const nameLength = buffer.readUInt16LE(offset + 28);
  const extraLength = buffer.readUInt16LE(offset + 30);
  const commentLength = buffer.readUInt16LE(offset + 32);
  const nameEnd = offset + CENTRAL_DIRECTORY_ENTRY_HEADER_BYTES + nameLength;
  if (nameEnd > buffer.length) {
    return null;
  }

  return {
    value: {
      name: buffer.toString(
        'utf-8',
        offset + CENTRAL_DIRECTORY_ENTRY_HEADER_BYTES,
        nameEnd
      ),
      uncompressedBytes,
    },
    nextOffset: nameEnd + extraLength + commentLength,
  };
};

const findEndOfCentralDirectory = (buffer: Buffer): number | null => {
  const lowestOffset = Math.max(
    0,
    buffer.length - END_OF_CENTRAL_DIRECTORY_BYTES - MAX_ZIP_COMMENT_BYTES
  );
  for (
    let offset = buffer.length - END_OF_CENTRAL_DIRECTORY_BYTES;
    offset >= lowestOffset;
    offset -= 1
  ) {
    if (buffer.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      return offset;
    }
  }
  return null;
};
