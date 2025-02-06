import { z } from 'zod';
import { correlatedActionsWithScoreFieldsSchema } from '../correlated-actions/correlated-actions.dto';
import {
  actionDefinitionEssentialSchema,
  treeNodeSchema,
} from '../models/action-definition.dto';
import { actionDefinitionMinimalWithTypeLevel } from '../models/action-definition.table';
import { actionTypeIncludingExempleSchema } from '../models/action-type.enum';

export const getReferentielResponseSchema = z
  .object({
    version: z.string(),
    orderedItemTypes: actionTypeIncludingExempleSchema.array(),
    itemsList: z.array(actionDefinitionMinimalWithTypeLevel).optional(),
    itemsTree: treeNodeSchema(
      actionDefinitionEssentialSchema.merge(
        correlatedActionsWithScoreFieldsSchema
      )
    ),
    itemsMap: z
      .record(z.string(), actionDefinitionMinimalWithTypeLevel)
      .optional(),
  })
  .describe('Referentiel sous forme de liste, map ou hierarchie');

export type GetReferentielResponseType = z.infer<
  typeof getReferentielResponseSchema
>;
