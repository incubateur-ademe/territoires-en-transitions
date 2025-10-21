import { createEnumObject } from '@/backend/utils/enum.utils';
import z from 'zod';

export const referentielIdEnumValues = ['cae', 'eci', 'te', 'te-test'] as const;

export const ReferentielIdEnum = createEnumObject(referentielIdEnumValues);

export const referentielIdEnumSchema = z.enum(referentielIdEnumValues);

export type ReferentielId = z.infer<typeof referentielIdEnumSchema>;
