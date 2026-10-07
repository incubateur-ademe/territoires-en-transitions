import * as z from 'zod/mini';
import { createEnumObject } from '../utils/enum.utils';

/**
 * Ajouté avec le référentiel CR: une entrée de ce référentiel peut être associée à un ou plusieurs labels
 */
export const referentielLabelEnumValues = ['te_cae', 'te_eci'] as const;

export const ReferentielLabelEnum = createEnumObject(referentielLabelEnumValues);

export const referentielLabelEnumSchema = z.enum(referentielLabelEnumValues);

export type ReferentielLabel = z.infer<typeof referentielLabelEnumSchema>;
