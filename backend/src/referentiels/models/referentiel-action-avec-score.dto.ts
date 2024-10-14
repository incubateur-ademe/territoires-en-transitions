import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { actionDefinitionSeulementIdObligatoireSchema } from './action-definition.table';
import { actionScoreSchema, ActionScoreType } from './action-score.dto';
import { ActionType } from './action-type.enum';
extendZodWithOpenApi(z);

export type ReferentielActionAvecScoreType = z.infer<
  typeof actionDefinitionSeulementIdObligatoireSchema
> & {
  level: number;
  action_type: ActionType;
  actions_enfant: ReferentielActionAvecScoreType[];
  score: ActionScoreType;
};

export const referentielActionAvecScoreDtoSchema: z.ZodType<ReferentielActionAvecScoreType> =
  extendApi(
    actionDefinitionSeulementIdObligatoireSchema
      .extend({
        level: z.number(),
        action_type: z.nativeEnum(ActionType),
        actions_enfant: z.lazy(() =>
          referentielActionAvecScoreDtoSchema.array(),
        ),
        score: actionScoreSchema,
      })
      .openapi({
        title: "Référentiel d'actions avec le score associé",
      }),
  );
