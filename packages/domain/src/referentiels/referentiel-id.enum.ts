import * as z from 'zod/mini';
import { createEnumObject } from '../utils/enum.utils';

export const referentielIdEnumValues = ['cae', 'eci', 'te', 'te-test'] as const;

export const ReferentielIdEnum = createEnumObject(referentielIdEnumValues);

export const referentielIdEnumSchema = z
  .enum(referentielIdEnumValues)
  .register(z.globalRegistry, {
    description: 'Identifiant du référentiel',
  });

export type ReferentielId = z.infer<typeof referentielIdEnumSchema>;
