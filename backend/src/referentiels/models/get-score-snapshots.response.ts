import z from 'zod';
import { SnapshotJalon } from '../snapshots/snapshot-jalon.enum';
import { scoreSnapshotSchema } from '../snapshots/snapshot.table';
import { referentielIdEnumSchema } from './referentiel-id.enum';

export const scoreSnapshotInfo = scoreSnapshotSchema
  .pick({
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
  })
  .extend({
    pointNonRenseigne: z.number().optional().describe('Points non renseignés'),
  });

export type ScoreSnapshotInfoType = z.infer<typeof scoreSnapshotInfo>;

export const scoreSnapshotCollectiviteInfo = scoreSnapshotSchema
  .pick({
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
  })
  .extend({
    pointNonRenseigne: z.number().optional(),
  });

export type ScoreSnapshotCollectiviteInfoType = z.infer<
  typeof scoreSnapshotCollectiviteInfo
>;

export const getScoreSnapshotsResponseSchema = z
  .object({
    collectiviteId: z.number(),
    referentielId: referentielIdEnumSchema,
    typesJalon: z.nativeEnum(SnapshotJalon).array(),
    snapshots: scoreSnapshotInfo.array(),
  })
  .describe(
    'Liste des snapshots de score pour une collectivité et un référentiel'
  );
export type GetScoreSnapshotsResponseType = z.infer<
  typeof getScoreSnapshotsResponseSchema
>;
