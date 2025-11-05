import {
  actionAuditStatutSchema,
  actionAuditStatutSchemaCreate,
  actionTypeSchema,
} from '@/domain/referentiels';
import * as z from 'zod/mini';

import { referentielIdEnumSchema } from '@/domain/referentiels';

// Get

export const getMesureAuditStatutInputSchema = z.pick(actionAuditStatutSchema, {
  collectiviteId: true,
  mesureId: true,
});

export type GetMesureAuditStatutInput = z.infer<
  typeof getMesureAuditStatutInputSchema
>;

export const getMesureAuditStatutOutputSchema = z.omit(
  actionAuditStatutSchema,
  {
    id: true,
    modifiedBy: true,
    modifiedAt: true,
  }
);

export type GetMesureAuditStatutOutput = z.infer<
  typeof getMesureAuditStatutOutputSchema
>;

// List

export const listMesureAuditStatutsInputSchema = z.object({
  collectiviteId: z.number(),
  referentielId: referentielIdEnumSchema,
});

export type ListMesureAuditStatutsInput = z.infer<
  typeof listMesureAuditStatutsInputSchema
>;

export const listMesureAuditStatutsOutputSchema = z.array(
  z.object({
    ...getMesureAuditStatutOutputSchema.shape,
    mesureType: actionTypeSchema,
    mesureNom: z.string(),
  })
);

export type ListMesureAuditStatutsOutput = z.infer<
  typeof listMesureAuditStatutsOutputSchema
>;

// Update

export const updateMesureAuditStatutRequestSchema = z.partial(
  z.pick(actionAuditStatutSchemaCreate, {
    collectiviteId: true,
    mesureId: true,
    statut: true,
    avis: true,
    ordreDuJour: true,
  }),
  {
    statut: true,
    avis: true,
    ordreDuJour: true,
  }
);

export type UpdateMesureAuditStatutInput = z.infer<
  typeof updateMesureAuditStatutRequestSchema
>;

export const updateMesureAuditStatutOutputSchema =
  getMesureAuditStatutOutputSchema;

export type UpdateMesureAuditStatutOutput = GetMesureAuditStatutOutput;
