
import { indicateurSchemaUpdate } from '@/backend/indicateurs/index-domain';
import z from 'zod';



export const updateIndicateurRequestSchema = indicateurSchemaUpdate.extend({
  collectiviteId: z.coerce
    .number()
    .int()
    .describe('Identifiant de la collectivité'),
});

export type UpdateIndicateurRequest = z.infer<typeof updateIndicateurRequestSchema>;
