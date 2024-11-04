import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { collectiviteRequestSchema } from '../../collectivites/models/collectivite.request';

extendZodWithOpenApi(z);

export enum CalculTrajectoireReset {
  MAJ_SPREADSHEET_EXISTANT = 'maj_spreadsheet_existant',
  NOUVEAU_SPREADSHEET = 'nouveau_spreadsheet',
}

export enum CalculTrajectoireResultatMode {
  DONNEES_EN_BDD = 'donnees_en_bdd',
  NOUVEAU_SPREADSHEET = 'nouveau_spreadsheet',
  MAJ_SPREADSHEET_EXISTANT = 'maj_spreadsheet_existant',
}

export const calculTrajectoireRequestSchema = extendApi(
  collectiviteRequestSchema.extend({
    mode: z.nativeEnum(CalculTrajectoireReset).optional().openapi({
      description: 'Mode pour forcer la recréation de la trajectoire',
    }),
    forceUtilisationDonneesCollectivite: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional()
      .openapi({
        description:
          "Force l'utilisation des données de la collectivité plutôt que celles du rare",
      }),
  })
);
export type CalculTrajectoireRequestType = z.infer<
  typeof calculTrajectoireRequestSchema
>;




