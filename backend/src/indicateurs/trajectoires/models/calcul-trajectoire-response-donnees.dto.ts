import { indicateurAvecValeursSchema } from '@/backend/indicateurs';
import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export const calculTrajectoireResponseDonneesSchema = extendApi(
  z
    .object({
      emissionsGes: z.array(indicateurAvecValeursSchema),
      consommationsFinales: z.array(indicateurAvecValeursSchema),
      sequestrations: z.array(indicateurAvecValeursSchema),
    })
    .describe('Données de la trajectoire SNBC')
);
export type CalculTrajectoireResponseDonneesType = z.infer<
  typeof calculTrajectoireResponseDonneesSchema
>;
