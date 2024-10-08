import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { actionDefinitionSeulementIdObligatoireSchema } from './action-definition.table';
import { ActionType } from './action-type.enum';
import {
  referentielActionOrigineSchema,
  ReferentielActionOrigineType,
} from './referentiel-action-origine.dto';
extendZodWithOpenApi(z);

export type ReferentielActionType = z.infer<
  typeof actionDefinitionSeulementIdObligatoireSchema
> & {
  level: number;
  action_type: ActionType;
  referentiels_origine?: string[];
  tags?: string[]; // action tags include cae, eci but also biodiversite, eau, coremeasure
  actions_origine?: ReferentielActionOrigineType[];
  actions_enfant: ReferentielActionType[];
};

export const referentielActionDtoSchema: z.ZodType<ReferentielActionType> =
  extendApi(
    actionDefinitionSeulementIdObligatoireSchema
      .extend({
        level: z.number(),
        action_type: z.nativeEnum(ActionType),
        referentiels_origine: z.string().array().optional(),
        tags: z.string().array().optional(),
        actions_origine: referentielActionOrigineSchema.array().optional(),
        points_catalogue: z.record(z.string(), z.number()).optional(),
        actions_enfant: z.lazy(() => referentielActionDtoSchema.array()),
      })
      .openapi({
        title: "Référentiel d'actions",
        description: 'Référentiel avec ses actions enfants',
      })
  );
