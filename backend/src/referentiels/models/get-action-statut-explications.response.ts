import { z } from 'zod';

// Called explication instead of commentaire to differentiate from discussion (and because it's named that way in the app)
export const simpleActionStatutExplicationSchema = z.object({
  explication: z.string(),
});
export type SimpleActionStatutExplicationType = z.infer<
  typeof simpleActionStatutExplicationSchema
>;

export const getActionStatutExplicationsResponseSchema = z
  .record(z.string(), simpleActionStatutExplicationSchema)
  .describe('Explications des statuts des actions');
export type GetActionStatutExplicationsResponseType = z.infer<
  typeof getActionStatutExplicationsResponseSchema
>;
