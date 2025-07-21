import { getEnumValues } from '@/backend/utils/index-domain';
import z from 'zod';

/**
 * Introduced with the TE referentiel: a unique referentiel measure/action can be taken into account for several labels
 */
export const ReferentielLabelEnum = {
  TE_CAE: 'te_cae',
  TE_ECI: 'te_eci',
} as const;

export const referentielLabelEnumValues = getEnumValues(ReferentielLabelEnum);

export const referentielLabelEnumSchema = z.enum(referentielLabelEnumValues);

export type ReferentielLabel = z.infer<typeof referentielLabelEnumSchema>;
