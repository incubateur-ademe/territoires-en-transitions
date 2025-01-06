import { z } from 'zod';
import { donneesARemplirResultSchema } from './donnees-a-remplir-result.dto';

export const donneesCalculTrajectoireARemplirSchema = z.object({
  sources: z.string().array(),
  emissionsGes: donneesARemplirResultSchema,
  consommationsFinales: donneesARemplirResultSchema,
  sequestrations: donneesARemplirResultSchema,
});
export type DonneesCalculTrajectoireARemplirType = z.infer<
  typeof donneesCalculTrajectoireARemplirSchema
>;
