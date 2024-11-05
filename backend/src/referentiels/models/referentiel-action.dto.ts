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
  actionType: ActionType;
  referentielsOrigine?: string[];
  tags?: string[]; // action tags include cae, eci but also biodiversite, eau, coremeasure
  actionsOrigine?: ReferentielActionOrigineType[];
  actionsEnfant: ReferentielActionType[];
};

export const referentielActionDtoSchema: z.ZodType<ReferentielActionType> =
  extendApi(
    actionDefinitionSeulementIdObligatoireSchema
      .extend({
        level: z.number(),
        actionType: z.nativeEnum(ActionType),
        referentielsOrigine: z.string().array().optional(),
        tags: z.string().array().optional(),
        actionsOrigine: referentielActionOrigineSchema.array().optional(),
        pointsCatalogue: z.record(z.string(), z.number()).optional(),
        actionsEnfant: z.lazy(() => referentielActionDtoSchema.array()),
      })
      .openapi({
        title: "Référentiel d'actions",
        description: 'Référentiel avec ses actions enfants',
      })
  );
