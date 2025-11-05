import z from 'zod';
import { filtreRessourceLieesSchema } from '../../shared/filtre-ressource-liees.schema';
import { getPaginationSchema } from '../../utils/pagination.schema';
import { collectiviteModuleTypeEnumSchema } from './collectivite-module-type.enum.schema';
import {
  tableauDeBordModuleSchema,
  tableauDeBordModuleSchemaCreate,
} from './tableau-de-bord-module.schema';

/**
 * Schema de filtre pour le fetch des plan actions.
 */
const fetchFilterSchema = filtreRessourceLieesSchema.pick({
  planActionIds: true,
  utilisateurPiloteIds: true,
  personnePiloteIds: true,
});

const sortValues = ['nom', 'created_at'] as const;
export const plansFetchOptionsSchema = getPaginationSchema(sortValues).extend({
  filtre: fetchFilterSchema.optional(),
});

const modulePlanActionListSpecificSchema = {
  type: z.literal(collectiviteModuleTypeEnumSchema.enum['plan-action.list']),
  options: plansFetchOptionsSchema,
};

export const modulePlanActionListSchema = z.object({
  ...tableauDeBordModuleSchema.shape,
  ...modulePlanActionListSpecificSchema,
});

export const modulePlanActionListSchemaCreate =
  tableauDeBordModuleSchemaCreate.extend(modulePlanActionListSpecificSchema);

export type ModulePlanActionList = z.infer<typeof modulePlanActionListSchema>;
