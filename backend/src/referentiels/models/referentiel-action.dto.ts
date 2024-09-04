import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { actionDefinitionSeulementIdObligatoireSchema } from './action-definition.table';
import { ActionType } from './action-type.enum';
extendZodWithOpenApi(z);

export type ReferentielActionType = z.infer<
  typeof actionDefinitionSeulementIdObligatoireSchema
> & {
  level: number;
  action_type: ActionType;
  actions_enfant: ReferentielActionType[];
};

export const referentielActionDtoSchema: z.ZodType<ReferentielActionType> =
  extendApi(
    actionDefinitionSeulementIdObligatoireSchema
      .extend({
        level: z.number(),
        action_type: z.nativeEnum(ActionType),
        actions_enfant: z.lazy(() => referentielActionDtoSchema.array()),
      })
      .openapi({
        title: "Référentiel d'actions",
        description: 'Référentiel avec ses actions enfants',
      }),
  );
