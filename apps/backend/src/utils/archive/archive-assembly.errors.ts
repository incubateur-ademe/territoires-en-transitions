import { createEnumObject } from '@tet/domain/utils';

const ArchiveAssemblyErrors = ['ARCHIVE_ASSEMBLY_FAILED'] as const;
export type ArchiveAssemblyError = (typeof ArchiveAssemblyErrors)[number];

export const ArchiveAssemblyErrorEnum = createEnumObject(ArchiveAssemblyErrors);
