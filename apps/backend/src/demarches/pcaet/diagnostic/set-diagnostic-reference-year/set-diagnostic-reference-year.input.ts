import { isPcaetDiagnosticReferenceYear } from '@tet/domain/demarches';
import { z } from 'zod';

const referenceYearSchema = z
  .number()
  .int()
  .refine((year) => isPcaetDiagnosticReferenceYear(year), {
    message:
      "L'année de référence doit être une année révolue, distincte des horizons d'objectif",
  });

export const setDiagnosticReferenceYearInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  /** Lignes du tableau concerné : l'année de référence est propre à chacun. */
  indicateurIds: z.array(z.number().int().positive()).min(1),
  /** `null` quand le tableau n'a pas encore d'année de référence. */
  fromYear: referenceYearSchema.nullable(),
  toYear: referenceYearSchema,
});

export type SetDiagnosticReferenceYearInput = z.infer<
  typeof setDiagnosticReferenceYearInputSchema
>;
