import { StatutTrajectoireSnbc3 } from '@tet/domain/indicateurs';
import { z } from 'zod';
import { calculTrajectoireResponseDonneesSchema } from '../calcul-trajectoire-response-donnees.dto';

export const millesimeSnbc3Schema = z
  .object({
    dateVersion: z.iso
      .datetime({ offset: true })
      .describe('Date du commit snbc3 importé'),
  })
  .describe('Millésime SNBC 3 en base (un seul à la fois)');

export const checkStatusTrajectoireSnbc3OutputSchema = z.object({
  status: z.enum(StatutTrajectoireSnbc3),
  millesime: millesimeSnbc3Schema.nullable(),
  epciParent: z
    .object({ id: z.number(), nom: z.string() })
    .optional()
    .describe(
      'EPCI à fiscalité propre de la commune, dont on peut consulter la trajectoire (statut `commune_non_supportee`)'
    ),
});
export type CheckStatusTrajectoireSnbc3Output = z.infer<
  typeof checkStatusTrajectoireSnbc3OutputSchema
>;

export const getTrajectoireSnbc3OutputSchema = z.object({
  millesime: millesimeSnbc3Schema.nullable(),
  trajectoire: calculTrajectoireResponseDonneesSchema,
});
export type GetTrajectoireSnbc3Output = z.infer<
  typeof getTrajectoireSnbc3OutputSchema
>;
