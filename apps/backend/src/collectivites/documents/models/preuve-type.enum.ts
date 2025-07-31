import { createEnumObject } from '@/backend/utils/enum.utils';
import { pgEnum } from 'drizzle-orm/pg-core';

export const preuveTypeValues = [
  'complementaire',
  'reglementaire',
  'labellisation',
  'audit',
  'rapport',
] as const;
export type PreuveType = (typeof preuveTypeValues)[number];
export const PreuveTypeEnum = createEnumObject(preuveTypeValues);

export const preuveTypePgEnum = pgEnum('preuve_type', preuveTypeValues);
