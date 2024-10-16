import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { donneesARemplirResultSchema } from './donnees-a-remplir-result.dto';

export const donneesCalculTrajectoireARemplirSchema = extendApi(
  z.object({
    sources: z.string().array(),
    emissionsGes: donneesARemplirResultSchema,
    consommationsFinales: donneesARemplirResultSchema,
    sequestrations: donneesARemplirResultSchema,
  })
);
export type DonneesCalculTrajectoireARemplirType = z.infer<
  typeof donneesCalculTrajectoireARemplirSchema
>;
