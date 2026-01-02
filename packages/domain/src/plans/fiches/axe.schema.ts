import * as z from 'zod/mini';
import { planTypeSchema } from '../plans/plan-type.schema';

const axeTableSchema = z.object({
  id: z.number(),
  nom: z.nullable(z.string()),
  description: z.nullish(z.string()),
  collectiviteId: z.number(),
  parent: z.nullable(z.number()),
  plan: z.nullable(z.number()),
  typeId: z.nullable(z.number()),
  createdAt: z.iso.datetime(),
  modifiedAt: z.iso.datetime(),
  modifiedBy: z.nullable(z.uuid()),
  panierId: z.nullable(z.number()),
});

export type AxeLight = z.infer<typeof axeTableSchema>;

export const axeSchemaCreate = z.partial(axeTableSchema, {
  id: true,
  nom: true,
  parent: true,
  plan: true,
  typeId: true,
  createdAt: true,
  modifiedAt: true,
  modifiedBy: true,
  panierId: true,
});

export type AxeCreate = z.infer<typeof axeSchemaCreate>;

export const axeSchema = z.object({
  ...axeTableSchema.shape,
  axes: z.nullable(z.array(axeTableSchema)),
  type: z.nullable(planTypeSchema),
});

export type Axe = z.infer<typeof axeSchema>;
