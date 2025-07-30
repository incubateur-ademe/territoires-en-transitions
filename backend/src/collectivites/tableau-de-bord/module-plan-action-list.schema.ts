import { plansFetchOptionsSchema } from '@/backend/plans/fiches/shared/models/plans-fetch-options.schema';
import z from 'zod';
import { collectiviteModuleEnumTypeSchema } from './collectivite-module-type.schema';
import {
  createTableauDeBordModuleSchema,
  tableauDeBordModuleSchema,
} from './tableau-de-bord-module.table';

const modulePlanActionListSpecificSchema = {
  type: z.literal(collectiviteModuleEnumTypeSchema.enum['plan-action.list']),
  options: plansFetchOptionsSchema,
};

export const modulePlanActionListSchema = tableauDeBordModuleSchema.extend(
  modulePlanActionListSpecificSchema
);

export const createModulePlanActionListSchema =
  createTableauDeBordModuleSchema.extend(modulePlanActionListSpecificSchema);

export type ModulePlanActionListType = z.infer<
  typeof modulePlanActionListSchema
>;

export type CreateModulePlanActionListType = z.infer<
  typeof createModulePlanActionListSchema
>;
