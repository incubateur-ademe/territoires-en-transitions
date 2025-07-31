import { z } from 'zod';
import { actionStatutSchema } from '../models/action-statut.table';

export const simpleActionStatutSchema = actionStatutSchema.pick({
  concerne: true,
  avancement: true,
  avancementDetaille: true,
});

export type SimpleActionStatutType = z.infer<typeof simpleActionStatutSchema>;

export const actionStatutsByActionIdSchema = z
  .record(z.string(), simpleActionStatutSchema)
  .describe('Statuts des actions');

export type ActionStatutsByActionId = z.infer<
  typeof actionStatutsByActionIdSchema
>;
