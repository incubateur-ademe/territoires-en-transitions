import * as z from 'zod/mini';
import { personnalisationReponsesPayloadSchema } from '../../collectivites/personnalisation-reponses-payload.schema';
import { referentielIdEnumSchema } from '../referentiel-id.enum';
import {
  ScoresPayload,
  scoresPayloadSchemaWithoutScoresJsonTree,
} from './score-snapshot-action-scores-payload.schema';
import { snapshotJalonEnumSchema } from './snapshot-jalon.enum';

const scoreSnapshotSchemaWithoutScoresJsonTree = z.object({
  collectiviteId: z.int(),
  referentielId: referentielIdEnumSchema,
  referentielVersion: z.nullable(z.string()),
  auditId: z.nullable(z.int()),
  date: z.iso.datetime(),
  jalon: snapshotJalonEnumSchema,
  ref: z.string(),
  nom: z.string(),
  pointFait: z.number(),
  pointProgramme: z.number(),
  pointPasFait: z.number(),
  pointPotentiel: z.number(),
  etoiles: z.nullable(z.number()),
  scoresPayload: scoresPayloadSchemaWithoutScoresJsonTree,
  personnalisationReponses: personnalisationReponsesPayloadSchema,
  createdAt: z.iso.datetime(),
  createdBy: z.nullable(z.string()),
  modifiedAt: z.iso.datetime(),
  modifiedBy: z.nullable(z.string()),
});

type ScoreSnapshotScoresPayloadWithoutScoresJsonTree = z.infer<
  typeof scoreSnapshotSchemaWithoutScoresJsonTree
>;

export interface ScoreSnapshot
  extends ScoreSnapshotScoresPayloadWithoutScoresJsonTree {
  scoresPayload: ScoresPayload;
}

export const scoreSnapshotCreateSchema = z.partial(
  scoreSnapshotSchemaWithoutScoresJsonTree,
  {
    referentielVersion: true,
    auditId: true,
    createdAt: true,
    createdBy: true,
    modifiedAt: true,
    modifiedBy: true,
  }
);

export type ScoreSnapshotCreate = z.infer<typeof scoreSnapshotCreateSchema> & {
  scoresPayload: ScoresPayload;
};

// All fields except JSON payloads (action scores and personnalisation reponses)
export const snapshotWithoutPayloadsSchema = z.object({
  ...z.omit(scoreSnapshotSchemaWithoutScoresJsonTree, {
    scoresPayload: true,
    personnalisationReponses: true,
  }).shape,

  pointNonRenseigne: z.optional(z.number()),
});

export type SnapshotWithoutPayloads = z.infer<
  typeof snapshotWithoutPayloadsSchema
>;
