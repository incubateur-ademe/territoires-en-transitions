import * as z from 'zod/mini';
import { preuveBaseSchema } from './preuve-base.schema';

export const annexeSchema = z.object({
  ...preuveBaseSchema.shape,
  ficheId: z.number(),
});

export type Annexe = z.infer<typeof annexeSchema>;
