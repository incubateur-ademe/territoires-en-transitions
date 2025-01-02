import { z } from 'zod';
import { actionDefinitionMinimalWithTypeLevel } from './action-definition.table';
import { ActionType } from './action-type.enum';
import { referentielActionDtoSchema } from './referentiel-action.dto';

export const getReferentielResponseSchema = z
  .object({
    version: z.string(),
    orderedItemTypes: z.array(z.nativeEnum(ActionType)),
    itemsList: z.array(actionDefinitionMinimalWithTypeLevel).optional(),
    itemsTree: referentielActionDtoSchema.optional(),
    itemsMap: z
      .record(z.string(), actionDefinitionMinimalWithTypeLevel)
      .optional(),
  })
  .describe('Referentiel sous forme de liste, map ou hierarchie');
export type GetReferentielResponseType = z.infer<
  typeof getReferentielResponseSchema
>;
