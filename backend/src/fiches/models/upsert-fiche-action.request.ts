import z from 'zod/lib';
import { createFicheActionSchema } from './fiche-action.table';
import { axeSchema } from './axe.table';

// Used for API documentation
export const upsertFicheActionRequestSchema = createFicheActionSchema.extend({
  axes: axeSchema.array().optional(),
});

// Used as DTO in the controller
export type UpsertFicheActionRequestType = z.infer<
  typeof upsertFicheActionRequestSchema
>;
