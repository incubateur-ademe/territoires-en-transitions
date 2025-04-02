import { getEnumValues } from '@/backend/utils/index-domain';
import z from 'zod';

export const SnapshotJalonEnum = {
  COURANT: 'score_courant', // Score courant
  DATE_PERSONNALISEE: 'date_personnalisee', // Date personnalisée
  PRE_AUDIT: 'pre_audit',
  POST_AUDIT: 'post_audit',
  JOUR_AUTO: 'jour_auto',
  LABELLISATION_EMT : 'labellisation_emt', // Viens d'un import manuel des labellisations EMT
} as const;

export const snapshotJalonEnumSchema = z.enum(getEnumValues(SnapshotJalonEnum));

export type SnapshotJalon = z.infer<typeof snapshotJalonEnumSchema>;
