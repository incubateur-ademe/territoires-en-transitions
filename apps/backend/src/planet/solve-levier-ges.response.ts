import { z } from 'zod';
import { estimateLevierGesResponseSchema } from './estimate-levier-ges.response';

export const solveLevierGesResponseSchema = z.object({
  solveFor: z.string().describe('Paramètre cherché'),
  value: z
    .string()
    .describe(
      'Valeur du paramètre qui atteint la réduction cible, la plus courte (jusqu’à douze décimales) qui redonne la cible'
    ),
  estimate: estimateLevierGesResponseSchema.describe(
    'Estimation du levier avec le paramètre à cette valeur'
  ),
});
export type SolveLevierGesResponse = z.infer<
  typeof solveLevierGesResponseSchema
>;
