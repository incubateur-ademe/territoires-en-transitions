import { extendApi, extendZodWithOpenApi } from "@anatine/zod-openapi";
import { z } from "zod";
import { indicateurAvecValeursSchema } from "./indicateur-valeur.table";

extendZodWithOpenApi(z);

export const calculTrajectoireResponseDonneesSchema = extendApi(
    z
      .object({
        emissionsGes: z.array(indicateurAvecValeursSchema),
        consommationsFinales: z.array(indicateurAvecValeursSchema),
        sequestrations: z.array(indicateurAvecValeursSchema),
      })
      .openapi({
        title: 'Données de la trajectoire SNBC',
      })
  );
  export type CalculTrajectoireResponseDonneesType = z.infer<
    typeof calculTrajectoireResponseDonneesSchema
  >;