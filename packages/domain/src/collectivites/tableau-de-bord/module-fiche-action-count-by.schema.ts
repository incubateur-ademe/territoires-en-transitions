import z from 'zod';
import { countByPropertyEnumSchema } from '../../plans/count-by-property-options.enum';
import { listFichesRequestFiltersSchema } from '../../plans/filters';
import { collectiviteModuleTypeEnumSchema } from './collectivite-module-type.enum.schema';
import {
  tableauDeBordModuleSchema,
  tableauDeBordModuleSchemaCreate,
} from './tableau-de-bord-module.schema';

const moduleFicheActionCountBySpecificSchema = z.object({
  type: z.literal(
    collectiviteModuleTypeEnumSchema.enum['fiche-action.count-by']
  ),
  options: z.object({
    countByProperty: countByPropertyEnumSchema,
    filtre: listFichesRequestFiltersSchema,
  }),
});

export const moduleFicheActionCountBySchema = z.object({
  ...tableauDeBordModuleSchema.shape,
  ...moduleFicheActionCountBySpecificSchema.shape,
});

export const moduleFicheCountBySchemaCreate = z.object({
  ...tableauDeBordModuleSchemaCreate.shape,
  ...moduleFicheActionCountBySpecificSchema.shape,
});

export type ModuleFicheCountBy = z.infer<typeof moduleFicheActionCountBySchema>;

export type ModuleFicheCountByCreate = z.infer<
  typeof moduleFicheCountBySchemaCreate
>;

export type ModuleFicheCountByProperty = z.infer<
  typeof countByPropertyEnumSchema
>;

export type ModuleFicheCountFilters = z.infer<
  typeof listFichesRequestFiltersSchema
>;
