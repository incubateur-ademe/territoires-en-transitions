import { MAX_EXTRA_YEARS } from '@tet/domain/demarches';
import { z } from 'zod';

/**
 * Années d'un topic, envoyées ensemble : déplacer l'année de comptabilisation
 * peut rendre une année ajoutée redondante, les deux se décident d'un bloc.
 */
export const setDiagnosticYearsInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  /** Code du topic dont on fixe les années. */
  topicCode: z.string().min(1),
  referenceYear: z.number().int(),
  /** Colonnes ajoutées au-delà des horizons réglementaires. */
  extraYears: z.array(z.number().int()).max(MAX_EXTRA_YEARS).default([]),
});

export type SetDiagnosticYearsInput = z.infer<
  typeof setDiagnosticYearsInputSchema
>;
