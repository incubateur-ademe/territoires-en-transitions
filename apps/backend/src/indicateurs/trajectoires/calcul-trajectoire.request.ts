import { zodQueryBoolean } from '@/backend/utils/zod.utils';
import { z } from 'zod';
import { collectiviteAnyIdentifiantRequestSchema } from '../../collectivites/collectivite.request';

export enum CalculTrajectoireReset {
  MAJ_SPREADSHEET_EXISTANT = 'maj_spreadsheet_existant',
  NOUVEAU_SPREADSHEET = 'nouveau_spreadsheet',
}

export const isCalculTrajectoireReset = (
  mode: unknown
): mode is CalculTrajectoireReset => {
  return [
    CalculTrajectoireReset.MAJ_SPREADSHEET_EXISTANT,
    CalculTrajectoireReset.NOUVEAU_SPREADSHEET,
  ].includes(mode as CalculTrajectoireReset);
};
export enum CalculTrajectoireResultatMode {
  DONNEES_EN_BDD = 'donnees_en_bdd',
  NOUVEAU_SPREADSHEET = 'nouveau_spreadsheet',
  MAJ_SPREADSHEET_EXISTANT = 'maj_spreadsheet_existant',
}

export const calculTrajectoireRequestSchema =
  collectiviteAnyIdentifiantRequestSchema.extend({
    mode: z
      .nativeEnum(CalculTrajectoireReset)
      .optional()
      .describe('Mode pour forcer la recréation de la trajectoire'),
    forceUtilisationDonneesCollectivite: zodQueryBoolean
      .optional()
      .describe(
        "Force l'utilisation des données de la collectivité plutôt que celles du rare"
      ),
  });
export type CalculTrajectoireRequestType = z.infer<
  typeof calculTrajectoireRequestSchema
>;
