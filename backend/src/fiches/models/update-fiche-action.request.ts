import z from 'zod/lib';
import { createFicheActionSchema } from './fiche-action.table';
import { axeSchema } from './axe.table';
import { thematiqueSchema } from './thematique.table';

export const updateFicheActionRequestSchema = createFicheActionSchema.extend({
  axes: axeSchema.array().optional(),
  thematiques: thematiqueSchema.array().optional(),
});

export type UpdateFicheActionRequestType = z.infer<
  typeof updateFicheActionRequestSchema
>;
