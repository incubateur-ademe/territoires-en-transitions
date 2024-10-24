import z from 'zod/lib';
import { createFicheActionSchema } from './fiche-action.table';
import { axeSchema } from './axe.table';
import { thematiqueSchema } from './thematique.table';
import { sousThematiqueSchema } from './sous-thematique.table';

// Used for API documentation
export const updateFicheActionRequestSchema = createFicheActionSchema.extend({
  axes: axeSchema.array().optional(),
  thematiques: thematiqueSchema.array().optional(),
  sous_thematiques: sousThematiqueSchema.array().optional(),
});

// Used as DTO in the controller
export type UpdateFicheActionRequestType = z.infer<
  typeof updateFicheActionRequestSchema
>;
