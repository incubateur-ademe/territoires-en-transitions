import { indicateurSchemaUpdate } from '@/backend/indicateurs/shared/models/indicateur-definition.table';
import z from 'zod';

export const updateIndicateurDefinitionRequestSchema =
  indicateurSchemaUpdate.extend({
    collectiviteId: z.coerce
      .number()
      .int()
      .describe('Identifiant de la collectivité'),
  });

export type UpdateIndicateurDefinitionRequest = z.infer<
  typeof updateIndicateurDefinitionRequestSchema
>;
