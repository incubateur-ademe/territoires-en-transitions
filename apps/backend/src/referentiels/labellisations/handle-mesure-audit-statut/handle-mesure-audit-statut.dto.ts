import { z } from 'zod';
import { actionTypeSchema } from '../../models/action-type.enum';
import { referentielIdEnumSchema } from '../../models/referentiel-id.enum';
import {
  mesureAuditStatutInsertSchema,
  mesureAuditStatutSchema,
} from './mesure-audit-statut.table';

// Get

export const getMesureAuditStatutInputSchema = mesureAuditStatutSchema.pick({
  collectiviteId: true,
  mesureId: true,
});

export type GetMesureAuditStatutInput = z.infer<
  typeof getMesureAuditStatutInputSchema
>;

export const getMesureAuditStatutOutputSchema = mesureAuditStatutSchema.omit({
  id: true,
  modifiedBy: true,
  modifiedAt: true,
});

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
  getMesureAuditStatutOutputSchema.extend({
    mesureType: actionTypeSchema,
    mesureNom: z.string(),
  })
);

export type ListMesureAuditStatutsOutput = z.infer<
  typeof listMesureAuditStatutsOutputSchema
>;

// Update

export const updateMesureAuditStatutRequestSchema =
  mesureAuditStatutInsertSchema
    .pick({
      collectiviteId: true,
      mesureId: true,
      statut: true,
      avis: true,
      ordreDuJour: true,
    })
    .partial({
      statut: true,
    });

export type UpdateMesureAuditStatutInput = z.infer<
  typeof updateMesureAuditStatutRequestSchema
>;

export const updateMesureAuditStatutOutputSchema =
  getMesureAuditStatutOutputSchema;

export type UpdateMesureAuditStatutOutput = GetMesureAuditStatutOutput;
