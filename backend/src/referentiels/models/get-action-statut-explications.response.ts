import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

// Called explication instead of commentaire to differentiate from discussion (and because it's named that way in the app)
export const simpleActionStatutExplicationSchema = extendApi(
  z.object({
    explication: z.string(),
  })
);
export type SimpleActionStatutExplicationType = z.infer<
  typeof simpleActionStatutExplicationSchema
>;

export const getActionStatutExplicationsResponseSchema = extendApi(
  z.record(z.string(), simpleActionStatutExplicationSchema)
).openapi({
  title: 'Explications des statuts des actions',
});
export type GetActionStatutExplicationsResponseType = z.infer<
  typeof getActionStatutExplicationsResponseSchema
>;
