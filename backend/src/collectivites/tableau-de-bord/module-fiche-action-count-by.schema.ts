import { collectiviteModuleEnumTypeSchema } from '@/backend/collectivites/tableau-de-bord/collectivite-module-type.schema';
import { countByPropertyEnumSchema } from '@/backend/plans/fiches';
import { fetchFichesFilterRequestSchema } from '@/backend/plans/fiches/shared/fetch-fiches-filter.request';
import z from 'zod';
import {
  createTableauDeBordModuleSchema,
  tableauDeBordModuleSchema,
} from './tableau-de-bord-module.table';

const moduleFicheActionCountBySpecificSchema = {
  type: z.literal(
    collectiviteModuleEnumTypeSchema.enum['fiche-action.count-by']
  ),
  options: z.object({
    countByProperty: countByPropertyEnumSchema,
    filtre: fetchFichesFilterRequestSchema,
  }),
};

export const moduleFicheActionCountBySchema = tableauDeBordModuleSchema.extend(
  moduleFicheActionCountBySpecificSchema
);

export const createModuleFicheActionCountBySchema =
  createTableauDeBordModuleSchema.extend(
    moduleFicheActionCountBySpecificSchema
  );

export type ModuleFicheActionCountByType = z.infer<
  typeof moduleFicheActionCountBySchema
>;

export type CreateModuleFicheActionCountByType = z.infer<
  typeof createModuleFicheActionCountBySchema
>;
