import { collectiviteRequestSchema } from '@/backend/collectivites/collectivite.request';
import z from 'zod';

export const getTableauDeBordModuleRequestSchema = collectiviteRequestSchema
  .extend({
    defaultKey: z.string().optional().describe('Clé de module par defaut'),
    id: z.string().optional().describe('Id du module'),
  })
  .refine(
    (data) => !!data.defaultKey || !!data.defaultKey,
    'Vous devez fournir ou un identifiant de module ou une clé de module par défaut.'
  );
export type GetTableauDeBordModuleRequestType = z.infer<
  typeof getTableauDeBordModuleRequestSchema
>;
