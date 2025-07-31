import { z } from 'zod';
import { personnalisationConsequenceSchema } from './personnalisation-consequence.dto';

export const personnalisationConsequencesByActionIdSchema = z
  .record(z.string(), personnalisationConsequenceSchema)
  .describe('Conséquence des règles de personnalisation sur les actions');

export type PersonnalisationConsequencesByActionId = z.infer<
  typeof personnalisationConsequencesByActionIdSchema
>;
