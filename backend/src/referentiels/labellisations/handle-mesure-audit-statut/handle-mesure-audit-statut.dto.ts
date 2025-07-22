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

export const getMesureAuditStatutResponseSchema = mesureAuditStatutSchema.omit({
  id: true,
  modifiedBy: true,
  modifiedAt: true,
});

export type GetMesureAuditStatutResponse = z.infer<
  typeof getMesureAuditStatutResponseSchema
>;

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
  getMesureAuditStatutResponseSchema;

export type UpdateMesureAuditStatutResponse = GetMesureAuditStatutResponse;
