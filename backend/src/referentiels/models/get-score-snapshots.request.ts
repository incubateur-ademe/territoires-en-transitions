import { z } from 'zod';
import { SnapshotJalon } from '../snapshots/snapshot-jalon.enum';

export const typesJalonEnumValues = Object.values(SnapshotJalon) as [
  SnapshotJalon,
  ...SnapshotJalon[]
];
export const typesJalonEnumSchema = z.enum(typesJalonEnumValues);

export const getScoreSnapshotsRequestSchema = z
  .object({
    typesJalon: z
      .string()
      .transform((value) => value.split(','))
      .pipe(typesJalonEnumSchema.array())
      .default(
        `${SnapshotJalon.PRE_AUDIT},${SnapshotJalon.POST_AUDIT},${SnapshotJalon.DATE_PERSONNALISEE},${SnapshotJalon.SCORE_COURANT},${SnapshotJalon.VISITE_ANNUELLE}`
      ), // All except JOUR_AUTO
  })
  .describe(
    'Paramètres de la requête pour obtenir la liste des snapshots de score'
  );
export type GetScoreSnapshotsRequestType = z.infer<
  typeof getScoreSnapshotsRequestSchema
>;
