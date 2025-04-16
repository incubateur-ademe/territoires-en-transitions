import { stringToJSON } from '@/domain/utils';
import { z } from 'zod';

export const statsConfigurationSchema = z.object({
  TET_API_URL: z.string().min(1).describe("Url de l'API TeT"),
  SUPABASE_DATABASE_URL: z
    .string()
    .min(1)
    .describe('Database url to be able to persist webhook events'),
  EXTERNAL_SYSTEM_SECRET_MAP: stringToJSON().describe(
    `Clé valeur contenant les accès pour les appels vers les systèmes externes`
  ),
});
export type StatsConfigurationType = z.infer<
  typeof statsConfigurationSchema
>;
