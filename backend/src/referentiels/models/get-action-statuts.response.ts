import { z } from 'zod';
import { actionStatutSchema } from './action-statut.table';

export const simpleActionStatutSchema = actionStatutSchema.pick({
  concerne: true,
  avancement: true,
  avancementDetaille: true,
});
export type SimpleActionStatutType = z.infer<typeof simpleActionStatutSchema>;

export const getActionStatutsResponseSchema = z
  .record(z.string(), simpleActionStatutSchema)
  .describe('Statuts des actions');
export type GetActionStatutsResponseType = z.infer<
  typeof getActionStatutsResponseSchema
>;
