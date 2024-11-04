import { extendApi, extendZodWithOpenApi } from "@anatine/zod-openapi";
import { z } from "zod";
import { CalculTrajectoireResultatMode } from "./calcul-trajectoire.request";
import { calculTrajectoireResponseDonneesSchema } from "./calcul-trajectoire-response-donnees.dto";

extendZodWithOpenApi(z);

export const calculTrajectoireResponseSchema = extendApi(
    z
      .object({
        mode: z.nativeEnum(CalculTrajectoireResultatMode),
        sourceDonneesEntree: z.string(),
        indentifiantsReferentielManquantsDonneesEntree: z.array(z.string()),
        trajectoire: calculTrajectoireResponseDonneesSchema,
      })
      .openapi({
        title: 'Réponse du calcul de la trajectoire SNBC',
      })
  );
  export type CalculTrajectoireResponseType = z.infer<
    typeof calculTrajectoireResponseSchema
  >;
  
  export interface CalculTrajectoireResultType
    extends CalculTrajectoireResponseType {
    spreadsheetId: string;
  }