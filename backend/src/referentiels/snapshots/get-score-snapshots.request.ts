import { z } from 'zod';
import { SnapshotJalonEnum } from './snapshot-jalon.enum';

export const DEFAULT_SNAPSHOT_JALONS = [
  SnapshotJalonEnum.PRE_AUDIT,
  SnapshotJalonEnum.POST_AUDIT,
  SnapshotJalonEnum.DATE_PERSONNALISEE,
  SnapshotJalonEnum.COURANT,
  SnapshotJalonEnum.VISITE_ANNUELLE,
] as const;

const typesJalonEnumSchema = z.enum(DEFAULT_SNAPSHOT_JALONS);

export const getScoreSnapshotsRequestSchema = z
  .object({
    typesJalon: z
      .string()
      .transform((value) => value.split(','))
      .pipe(typesJalonEnumSchema.array())
      .optional()
      .default(DEFAULT_SNAPSHOT_JALONS.join(',')),
  })
  .describe(
    'Paramètres de la requête pour obtenir la liste des snapshots de score'
  );

export type GetScoreSnapshotsRequestType = z.infer<
  typeof getScoreSnapshotsRequestSchema
>;
