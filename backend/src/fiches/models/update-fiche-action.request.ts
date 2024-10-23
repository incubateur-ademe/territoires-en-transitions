import z from 'zod/lib';
import { createFicheActionSchema } from './fiche-action.table';
import { axeSchema, createAxeSchema } from './axe.table';

export const updateFicheActionRequestSchema = createFicheActionSchema.extend({
  axes: axeSchema.array().optional(),
});

export const updateAxesRequestSchema = createAxeSchema;

export type UpdateFicheActionRequestType = z.infer<
  typeof updateFicheActionRequestSchema
>;

export type UpdateAxeRequestType = z.infer<typeof updateAxesRequestSchema>;
