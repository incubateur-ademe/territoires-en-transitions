import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { actionStatutSchema } from './action-statut.table';

export const getActionStatutsResponseSchema = extendApi(
  z.record(
    z.string(),
    actionStatutSchema.pick({
      concerne: true,
      avancement: true,
      avancement_detaille: true,
    }),
  ),
).openapi({
  title: 'Statuts des actions',
});
export type GetActionStatutsResponseType = z.infer<
  typeof getActionStatutsResponseSchema
>;
