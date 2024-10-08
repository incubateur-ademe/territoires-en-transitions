import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { actionDefinitionSeulementIdObligatoireSchema } from './action-definition.table';
import {
  actionPointScoreSchema,
  ActionPointScoreType,
} from './action-point-score.dto';
import { actionScoreSchema, ActionScoreType } from './action-score.dto';
import { ActionType } from './action-type.enum';
import {
  referentielActionOrigineWithScoreSchema,
  ReferentielActionOrigineWithScoreType,
} from './referentiel-action-origine-with-score.dto';
extendZodWithOpenApi(z);

export type ReferentielActionWithScoreType = z.infer<
  typeof actionDefinitionSeulementIdObligatoireSchema
> & {
  level: number;
  action_type: ActionType;
  actions_origine?: ReferentielActionOrigineWithScoreType[];
  scores_origine?: Record<string, ActionPointScoreType>;
  tags?: string[]; // action catalogues include cae, eci but also biodiversite, eau
  scores_tag: Record<string, ActionPointScoreType>;
  actions_enfant: ReferentielActionWithScoreType[];
  referentiels_origine?: string[];
  score: ActionScoreType;
};

export const referentielActionAvecScoreDtoSchema: z.ZodType<ReferentielActionWithScoreType> =
  extendApi(
    actionDefinitionSeulementIdObligatoireSchema
      .extend({
        level: z.number(),
        action_type: z.nativeEnum(ActionType),
        referentiels_origine: z.string().array().optional(),
        scores_origine: z.record(z.string(), actionPointScoreSchema).optional(),
        tags: z.string().array().optional(),
        scores_tag: z
          .record(z.string(), actionPointScoreSchema),
        actions_origine: referentielActionOrigineWithScoreSchema
          .array()
          .optional(),
        actions_enfant: z.lazy(() =>
          referentielActionAvecScoreDtoSchema.array()
        ),
        score: actionScoreSchema,
      })
      .openapi({
        title: "Référentiel d'actions avec le score associé",
      })
  );
