import { getEnumValues } from '@/domain/utils';
import z from 'zod';

export const SnapshotJalonEnum = {
  COURANT: 'score_courant', // Score courant
  DATE_PERSONNALISEE: 'date_personnalisee', // Date personnalisée
  PRE_AUDIT: 'pre_audit',
  POST_AUDIT: 'post_audit',
  VISITE_ANNUELLE: 'visite_annuelle',
  JOUR_AUTO: 'jour_auto',
} as const;

export const snapshotJalonEnumSchema = z.enum(getEnumValues(SnapshotJalonEnum));

export type SnapshotJalon = z.infer<typeof snapshotJalonEnumSchema>;
