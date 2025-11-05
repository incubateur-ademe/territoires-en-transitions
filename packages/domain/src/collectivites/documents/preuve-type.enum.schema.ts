import * as z from 'zod/mini';
import { createEnumObject } from '../../utils/enum.utils';

export const preuveTypeEnumValues = [
  'complementaire',
  'reglementaire',
  'labellisation',
  'audit',
  'rapport',
] as const;

export const PreuveTypeEnum = createEnumObject(preuveTypeEnumValues);

export const preuveTypeEnumSchema = z.enum(preuveTypeEnumValues);

export type PreuveType = z.infer<typeof preuveTypeEnumSchema>;
