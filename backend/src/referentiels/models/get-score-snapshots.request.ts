import { z } from 'zod';
import { ScoreJalon } from './score-jalon.enum';

export const typesJalonEnumValues = Object.values(ScoreJalon) as [
  ScoreJalon,
  ...ScoreJalon[]
];
export const typesJalonEnumSchema = z.enum(typesJalonEnumValues);

export const getScoreSnapshotsRequestSchema = z
  .object({
    typesJalon: z
      .string()
      .transform((value) => value.split(','))
      .pipe(typesJalonEnumSchema.array())
      .default(
        `${ScoreJalon.PRE_AUDIT},${ScoreJalon.POST_AUDIT},${ScoreJalon.DATE_PERSONNALISEE},${ScoreJalon.SCORE_COURANT},${ScoreJalon.VISITE_ANNUELLE}`
      ), // All except JOUR_AUTO
  })
  .describe(
    'Paramètres de la requête pour obtenir la liste des snapshots de score'
  );
export type GetScoreSnapshotsRequestType = z.infer<
  typeof getScoreSnapshotsRequestSchema
>;
