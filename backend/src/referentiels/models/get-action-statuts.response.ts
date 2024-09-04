import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { actionStatutSchema } from './action-statut.table';

export const simpleActionStatutSchema = extendApi(
  actionStatutSchema.pick({
    concerne: true,
    avancement: true,
    avancement_detaille: true,
  })
);
export type SimpleActionStatutType = z.infer<typeof simpleActionStatutSchema>;

export const getActionStatutsResponseSchema = extendApi(
  z.record(z.string(), simpleActionStatutSchema)
).openapi({
  title: 'Statuts des actions',
});
export type GetActionStatutsResponseType = z.infer<
  typeof getActionStatutsResponseSchema
>;
