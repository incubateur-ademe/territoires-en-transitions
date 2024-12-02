import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { calculTrajectoireResponseDonneesSchema } from './calcul-trajectoire-response-donnees.dto';
import { CalculTrajectoireResultatMode } from './calcul-trajectoire.request';

export const calculTrajectoireResponseSchema = extendApi(
  z
    .object({
      mode: z.nativeEnum(CalculTrajectoireResultatMode),
      sourcesDonneesEntree: z.string().array(),
      indentifiantsReferentielManquantsDonneesEntree: z.array(z.string()),
      trajectoire: calculTrajectoireResponseDonneesSchema,
    })
    .describe('Réponse du calcul de la trajectoire SNBC')
);
export type CalculTrajectoireResponseType = z.infer<
  typeof calculTrajectoireResponseSchema
>;

export interface CalculTrajectoireResultType
  extends CalculTrajectoireResponseType {
  spreadsheetId: string;
}
