import { collectiviteIdInputSchema } from '@tet/backend/collectivites/collectivite-id.input';
import z from 'zod';

export const getModuleRequestSchema = z
  .object({
    ...collectiviteIdInputSchema.shape,

    defaultKey: z.string().optional().describe('Clé de module par defaut'),
    id: z.string().optional().describe('Id du module'),
  })
  .refine(
    (data) => !!data.defaultKey || !!data.id,
    'Vous devez fournir ou un identifiant de module ou une clé de module par défaut.'
  );
export type GetModuleRequestType = z.infer<typeof getModuleRequestSchema>;
