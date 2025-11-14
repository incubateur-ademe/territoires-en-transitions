import * as z from 'zod/mini';

export const MesureAuditStatutEnum = {
  NON_AUDITE: 'non_audite',
  EN_COURS: 'en_cours',
  AUDITE: 'audite',
} as const;

export const mesureAuditStatutEnumSchema = z.enum(MesureAuditStatutEnum);

export type MesureAuditStatutEnum =
  (typeof MesureAuditStatutEnum)[keyof typeof MesureAuditStatutEnum];
