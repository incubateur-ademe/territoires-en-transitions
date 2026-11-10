import { createEnumObject } from '@tet/domain/utils';

const ArchiveAssemblyErrors = [
  'ARCHIVE_ASSEMBLY_FAILED',
  'ARCHIVE_TOO_LARGE',
] as const;
export type ArchiveAssemblyError = (typeof ArchiveAssemblyErrors)[number];

export const ArchiveAssemblyErrorEnum = createEnumObject(ArchiveAssemblyErrors);
