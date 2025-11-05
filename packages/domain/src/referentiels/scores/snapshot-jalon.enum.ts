import z from 'zod';

export const SnapshotJalonEnum = {
  COURANT: 'score_courant',
  DATE_PERSONNALISEE: 'date_personnalisee',
  PRE_AUDIT: 'pre_audit',
  POST_AUDIT: 'post_audit',
  LABELLISATION_EMT: 'labellisation_emt',
} as const;

export const snapshotJalonEnumValues = [
  SnapshotJalonEnum.COURANT,
  SnapshotJalonEnum.DATE_PERSONNALISEE,
  SnapshotJalonEnum.PRE_AUDIT,
  SnapshotJalonEnum.POST_AUDIT,
  SnapshotJalonEnum.LABELLISATION_EMT,
] as const;

export const snapshotJalonEnumSchema = z.enum(SnapshotJalonEnum);
export type SnapshotJalon = z.infer<typeof snapshotJalonEnumSchema>;
