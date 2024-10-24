import { z } from 'zod';
import { planActionTypeSchema } from './plan-action-type.schema';

export const baseAxeSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  nom: z.string().nullable().optional(),
  parent: z.number().nullable(),
  plan: z.number().nullable(),
  type: planActionTypeSchema.nullable(),
  createdAt: z.string().date().optional(),
  modifiedAt: z.string().date().optional(),
  modifiedBy: z.string().nullable(),
});

export const axeSchema = baseAxeSchema.extend({
  axes: z.array(baseAxeSchema).optional(),
});

export type Axe = z.input<typeof axeSchema>;

export const axeInsertSchema = baseAxeSchema.extend({
  id: z.number().optional(),
});

export type AxeInsert = z.input<typeof axeInsertSchema>;
