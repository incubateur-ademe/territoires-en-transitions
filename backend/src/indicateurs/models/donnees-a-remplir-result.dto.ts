import { extendApi } from "@anatine/zod-openapi";
import { z } from "zod";
import { donneesARemplirValeurSchema } from "./donnees-a-remplir-valeur.dto";

export const donneesARemplirResultSchema = extendApi(
    z.object({
      valeurs: z.array(donneesARemplirValeurSchema),
      identifiantsReferentielManquants: z.array(z.string()),
    })
  );
  export type DonneesARemplirResultType = z.infer<
    typeof donneesARemplirResultSchema
  >;