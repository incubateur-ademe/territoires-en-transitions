import { z } from 'zod';
import { actionDefinitionSeulementIdObligatoireSchema } from '../models/action-definition.table';
import { ActionType } from '../models/action-type.enum';
import {
  referentielActionOrigineSchema,
  ReferentielActionOrigineType,
} from './referentiel-action-origine.dto';

export type ReferentielAction = z.infer<
  typeof actionDefinitionSeulementIdObligatoireSchema
> & {
  level: number;
  actionType: ActionType;
  referentielsOrigine?: string[];
  tags?: string[]; // action tags include cae, eci but also biodiversite, eau, coremeasure
  actionsOrigine?: ReferentielActionOrigineType[];
  actionsEnfant: ReferentielAction[];
};

export const referentielActionDtoSchema: z.ZodType<ReferentielAction> =
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
    .describe('Référentiel avec ses actions enfants');
