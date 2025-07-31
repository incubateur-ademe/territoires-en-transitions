import { z } from 'zod';
import { calculTrajectoireResponseDonneesSchema } from './calcul-trajectoire-response-donnees.dto';
import { CalculTrajectoireResultatMode } from './calcul-trajectoire.request';

export const calculTrajectoireResponseSchema = z
  .object({
    mode: z.nativeEnum(CalculTrajectoireResultatMode),
    sourcesDonneesEntree: z.string().array(),
    indentifiantsReferentielManquantsDonneesEntree: z.array(z.string()),
    trajectoire: calculTrajectoireResponseDonneesSchema,
  })
  .describe('Réponse du calcul de la trajectoire SNBC');

export type CalculTrajectoireResponse = z.infer<
  typeof calculTrajectoireResponseSchema
>;

export interface CalculTrajectoireResult extends CalculTrajectoireResponse {
  spreadsheetId: string;
}
