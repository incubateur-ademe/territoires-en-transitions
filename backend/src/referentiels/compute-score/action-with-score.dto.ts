import { preuveSchemaEssential } from '@/backend/collectivites/documents/models/preuve.dto';
import { z } from 'zod';
import { actionDefinitionSeulementIdObligatoireSchema } from '../models/action-definition.table';
import { ActionType } from '../models/action-type.enum';
import { referentielActionOrigineWithScoreSchema } from './referentiel-action-origine-with-score.dto';
import {
  scoreFinalSchema,
  scoreSchema,
  scoreWithOnlyPointsSchema,
} from './score.dto';

const actionWithScoreBaseSchema = actionDefinitionSeulementIdObligatoireSchema
  .extend({
    level: z.number(),
    actionType: z.nativeEnum(ActionType),
    referentielsOrigine: z.string().array().optional(),
    actionsOrigine: referentielActionOrigineWithScoreSchema.array().optional(),
    scoresOrigine: z
      .record(z.string(), scoreWithOnlyPointsSchema.nullable())
      .optional(),
    // action catalogues include cae, eci but also biodiversite, eau
    tags: z.string().array().optional(),
    scoresTag: z.record(z.string(), scoreWithOnlyPointsSchema),
    preuves: preuveSchemaEssential.array().optional(),
    score: scoreSchema,
  })
  .describe("Référentiel d'actions avec le score associé");

// Petit bazar de types Zod pour gérer la récursivité de `actionsEnfants`
// Cf. https://zod.dev/?id=recursive-types
export type ActionWithScore = z.infer<typeof actionWithScoreBaseSchema> & {
  actionsEnfant: ActionWithScore[];
};

export const actionWithScoreSchema: z.ZodType<ActionWithScore> =
  actionWithScoreBaseSchema.extend({
    actionsEnfant: z.lazy(() => actionWithScoreSchema.array()),
  });

//
// Same schema and type but with `score` fields and other root fields made required
// 👇

const actionWithScoreFinalBaseSchema = actionWithScoreBaseSchema.extend({
  actionId: actionWithScoreBaseSchema.shape.actionId.unwrap(),
  identifiant: actionWithScoreBaseSchema.shape.identifiant.unwrap(),
  nom: actionWithScoreBaseSchema.shape.nom.unwrap(),
  categorie: actionWithScoreBaseSchema.shape.categorie.unwrap(),
  score: scoreFinalSchema,
});

export type ActionWithScoreFinal = z.infer<
  typeof actionWithScoreFinalBaseSchema
> & {
  actionsEnfant: ActionWithScoreFinal[];
};

export const actionWithScoreFinalSchema: z.ZodType<ActionWithScoreFinal> =
  actionWithScoreFinalBaseSchema.extend({
    actionsEnfant: z.lazy(() => actionWithScoreFinalSchema.array()),
  });
