import z from 'zod/lib';
import { createFicheActionSchema } from './fiche-action.table';
import { axeSchema } from './axe.table';

export const upsertFicheActionRequestSchema = createFicheActionSchema.extend({
  axes: axeSchema.array().optional(),
});

export type UpsertFicheActionRequestType = z.infer<
  typeof upsertFicheActionRequestSchema
>;
