import { actionStatutSchema } from '@tet/domain/referentiels';
import * as z from 'zod/mini';

export const simpleActionStatutSchema = z.partial(
  z.pick(actionStatutSchema, {
    concerne: true,
    avancement: true,
    avancementDetaille: true,
    modifiedBy: true,
    modifiedAt: true,
  }),
  {
    modifiedBy: true,
    modifiedAt: true,
  }
);

export type SimpleActionStatutType = z.infer<typeof simpleActionStatutSchema>;

export const actionStatutsByActionIdSchema = z.record(
  z.string(),
  simpleActionStatutSchema
);

export type ActionStatutsByActionId = z.infer<
  typeof actionStatutsByActionIdSchema
>;
