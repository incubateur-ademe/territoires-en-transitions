import z from 'zod';

export const SnapshotJalonEnum = {
  COURANT: 'score_courant', // Score courant
  DATE_PERSONNALISEE: 'date_personnalisee', // Date personnalisée
  PRE_AUDIT: 'pre_audit',
  POST_AUDIT: 'post_audit',
  LABELLISATION_EMT: 'labellisation_emt', // Viens d'un import manuel des labellisations EMT
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
