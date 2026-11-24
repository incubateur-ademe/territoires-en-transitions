import { z } from 'zod';

export const estimateLevierGesResponseSchema = z.object({
  reduction: z
    .string()
    .describe(
      'Tonnes de CO2e évitées par an, texte décimal arrondi à deux décimales'
    ),
  status: z
    .enum(['no_open_question', 'workaround'])
    .describe(
      "`workaround` : niveau calculé par un contournement documenté dans la méthodologie du levier"
    ),
  appliedAssumptions: z
    .record(
      z.string(),
      z.object({
        value: z.string(),
        source: z.string(),
        limit: z.string(),
      })
    )
    .describe('Hypothèses appliquées au calcul'),
  limits: z
    .array(z.object({ limit: z.string(), effect: z.string() }))
    .describe('Limites connues du levier, à restituer avec le résultat'),
  datasets: z
    .array(
      z.object({
        dataset: z.string(),
        source: z.string(),
        vintage: z.string(),
        retrievedOn: z.string(),
      })
    )
    .describe('Jeux de données lus par le calcul, avec leur millésime'),
});
export type EstimateLevierGesResponse = z.infer<
  typeof estimateLevierGesResponseSchema
>;
