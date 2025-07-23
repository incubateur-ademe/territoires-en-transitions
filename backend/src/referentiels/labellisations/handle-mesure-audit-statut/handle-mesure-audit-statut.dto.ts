import { referentielIdEnumSchema } from '@/backend/referentiels/index-domain';
import { z } from 'zod';
import {
  mesureAuditStatutInsertSchema,
  mesureAuditStatutSchema,
} from './mesure-audit-statut.table';

export const getMesureAuditStatutRequestSchema = mesureAuditStatutSchema.pick({
  collectiviteId: true,
  mesureId: true,
});

export type GetMesureAuditStatutRequest = z.infer<
  typeof getMesureAuditStatutRequestSchema
>;

export const listMesureAuditStatutsRequestSchema = z.object({
  collectiviteId: z.number(),
  referentielId: referentielIdEnumSchema,
});

export type ListMesureAuditStatutsRequest = z.infer<
  typeof listMesureAuditStatutsRequestSchema
>;

export const mesureAuditStatutResponseSchema = mesureAuditStatutSchema.omit({
  id: true,
  modifiedBy: true,
  modifiedAt: true,
});

export type MesureAuditStatut = z.infer<typeof mesureAuditStatutResponseSchema>;

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

export type UpdateMesureAuditStatutRequest = z.infer<
  typeof updateMesureAuditStatutRequestSchema
>;

export const updateMesureAuditStatutResponseSchema =
  mesureAuditStatutResponseSchema;

export type UpdateMesureAuditStatutResponse = MesureAuditStatut;
