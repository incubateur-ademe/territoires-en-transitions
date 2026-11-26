import { z } from 'zod';
import { estimateLevierGesRequestSchema } from './estimate-levier-ges.request';

export const solveLevierGesRequestSchema =
  estimateLevierGesRequestSchema.extend({
    solveFor: z
      .string()
      .min(1)
      .describe(
        'Paramètre du levier à chercher, parmi ceux que le levier permet de chercher. Un paramètre imbriqué s’écrit en chemin pointé (`animals.dairyCows.headcountReductionFraction`). La valeur déjà saisie dans `parameters` est ignorée.'
      ),
    targetReductionTco2e: z
      .string()
      .min(1)
      .describe(
        'Tonnes de CO2e évitées par an à atteindre, texte décimal (`"117"`)'
      ),
  });
export type SolveLevierGesRequest = z.infer<typeof solveLevierGesRequestSchema>;
