import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { actionDefinitionMinimalWithTypeLevel } from '../shared/models/action-definition.table';
import { ActionType } from '../shared/models/action-type.enum';
import { referentielActionDtoSchema } from '../shared/models/referentiel-action.dto';

export const getReferentielResponseSchema = extendApi(
  z.object({
    version: z.string(),
    orderedItemTypes: z.array(z.nativeEnum(ActionType)),
    itemsList: z.array(actionDefinitionMinimalWithTypeLevel).optional(),
    itemsTree: referentielActionDtoSchema.optional(),
    itemsMap: z
      .record(z.string(), actionDefinitionMinimalWithTypeLevel)
      .optional(),
  })
).describe('Referentiel sous forme de liste, map ou hierarchie');
export type GetReferentielResponseType = z.infer<
  typeof getReferentielResponseSchema
>;
