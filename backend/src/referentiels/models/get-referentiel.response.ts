import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { actionDefinitionMinimalWithTypeLevel } from './action-definition.table';
import { ActionType } from './action-type.enum';
import { referentielActionDtoSchema } from './referentiel-action.dto';

export const getReferentielResponseSchema = extendApi(
  z.object({
    ordered_item_types: z.array(z.nativeEnum(ActionType)),
    items_list: z.array(actionDefinitionMinimalWithTypeLevel).optional(),
    items_tree: referentielActionDtoSchema.optional(),
    items_map: z
      .record(z.string(), actionDefinitionMinimalWithTypeLevel)
      .optional(),
  })
).openapi({
  title: 'Referentiel sous forme de liste, map ou hierarchie',
});
export type GetReferentielResponseType = z.infer<
  typeof getReferentielResponseSchema
>;
