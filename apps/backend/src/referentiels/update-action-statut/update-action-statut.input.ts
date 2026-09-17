import { actionStatutSchemaCreate } from '@tet/domain/referentiels';
import z from 'zod';

export const upsertActionStatutsInputSchema = z.object({
  actionStatuts: z.array(actionStatutSchemaCreate).min(1),
});

export type UpsertActionStatutsInput = z.infer<
  typeof upsertActionStatutsInputSchema
>;
