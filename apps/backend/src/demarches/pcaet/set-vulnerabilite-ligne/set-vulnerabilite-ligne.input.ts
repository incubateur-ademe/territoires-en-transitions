import {
  demarchePcaetVulnerabiliteHorizonValues,
  demarchePcaetVulnerabiliteNiveauValues,
  OBJECTIFS_MAX_LENGTH,
} from '@tet/domain/demarches';
import { z } from 'zod';

/**
 * Une cellule à la fois : le tableau enregistre au fil de la saisie, et une
 * saisie n'écrit que l'horizon visé.
 */
export const setVulnerabiliteLigneInputSchema = z
  .object({
    collectiviteId: z.number().int().positive(),
    demarcheId: z.number().int().positive(),
    thematiqueId: z.number().int().positive(),
    niveau: z
      .object({
        horizon: z.enum(demarchePcaetVulnerabiliteHorizonValues),
        /** `null` retire la saisie. */
        valeur: z.enum(demarchePcaetVulnerabiliteNiveauValues).nullable(),
      })
      .optional(),
    objectifs2050: z.string().max(OBJECTIFS_MAX_LENGTH).nullable().optional(),
    objectifs2100: z.string().max(OBJECTIFS_MAX_LENGTH).nullable().optional(),
  })
  .refine(
    ({ niveau, objectifs2050, objectifs2100 }) =>
      niveau !== undefined ||
      objectifs2050 !== undefined ||
      objectifs2100 !== undefined,
    { message: 'Le patch doit porter au moins un niveau ou un objectif' }
  );

export type SetVulnerabiliteLigneInput = z.infer<
  typeof setVulnerabiliteLigneInputSchema
>;
