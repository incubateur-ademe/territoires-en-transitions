import z from 'zod';
import { referentielIdEnumSchema } from './referentiel.enum';
import { ScoreJalon } from './score-jalon.enum';
import { scoreSnapshotSchema } from './score-snapshot.table';

export const scoreSnapshotInfo = scoreSnapshotSchema.pick({
  ref: true,
  nom: true,
  date: true,
  typeJalon: true,
  pointFait: true,
  pointProgramme: true,
  pointPasFait: true,
  pointPotentiel: true,
  referentielVersion: true,
  auditId: true,
  createdAt: true,
  createdBy: true,
  modifiedAt: true,
  modifiedBy: true,
});

export type ScoreSnapshotInfoType = z.infer<typeof scoreSnapshotInfo>;

export const scoreSnapshotCollectiviteInfo = scoreSnapshotSchema.pick({
  collectiviteId: true,
  referentielId: true,
  ref: true,
  nom: true,
  date: true,
  typeJalon: true,
  pointFait: true,
  pointProgramme: true,
  pointPasFait: true,
  pointPotentiel: true,
  referentielVersion: true,
  auditId: true,
  createdAt: true,
  createdBy: true,
  modifiedAt: true,
  modifiedBy: true,
});

export type ScoreSnapshotCollectiviteInfoType = z.infer<
  typeof scoreSnapshotCollectiviteInfo
>;

export const getScoreSnapshotsResponseSchema = z
  .object({
    collectiviteId: z.number(),
    referentielId: referentielIdEnumSchema,
    typesJalon: z.nativeEnum(ScoreJalon).array(),
    snapshots: scoreSnapshotInfo.array(),
  })
  .describe(
    'Liste des snapshots de score pour une collectivité et un référentiel'
  );
export type GetScoreSnapshotsResponseType = z.infer<
  typeof getScoreSnapshotsResponseSchema
>;
