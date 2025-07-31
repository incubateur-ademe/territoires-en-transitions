import { z } from 'zod';
import { donneesARemplirResultSchema } from './donnees-a-remplir-result.dto';

export const donneesCalculTrajectoireARemplirSchema = z.object({
  sources: z.string().array(),
  lastModifiedAt: z
    .string()
    .datetime()
    .nullish()
    .describe("Date de dernière modification des données d'entrée"),
  emissionsGes: donneesARemplirResultSchema,
  consommationsFinales: donneesARemplirResultSchema,
  sequestrations: donneesARemplirResultSchema,
});
export type DonneesCalculTrajectoireARemplirType = z.infer<
  typeof donneesCalculTrajectoireARemplirSchema
>;
