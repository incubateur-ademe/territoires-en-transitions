import {
  ListDefinitionsInputFilters,
  listDefinitionsInputFiltersSchema,
} from '../indicateurs';
import {
  ListFichesRequestFilters,
  listFichesRequestFiltersSchema,
} from '../plans';
import { listActionsRequestOptionsSchema } from '../referentiels';
import { getPaginationSchema, LIMIT_DEFAULT } from '../utils';
import { z } from 'zod';

const MODULE_FICHES_LIMIT_DEFAULT = 10;
const MODULE_INDICATEURS_LIMIT_DEFAULT = 3;
const MODULE_MESURES_LIMIT_DEFAULT = 4;

const moduleFichesPaginationBaseSchema = getPaginationSchema([
  'modified_at',
  'created_at',
  'titre',
]);

const moduleFichesPaginationSchema = z.object({
  ...moduleFichesPaginationBaseSchema.shape,
  filtre: listFichesRequestFiltersSchema,
  limit: z.coerce
    .number()
    .min(1)
    .max(LIMIT_DEFAULT)
    .prefault(MODULE_FICHES_LIMIT_DEFAULT),
});

const moduleIndicateursPaginationBaseSchema = getPaginationSchema([
  'text',
  'estComplet',
]);

const moduleIndicateursPaginationSchema = z.object({
  ...moduleIndicateursPaginationBaseSchema.shape,
  filtre: listDefinitionsInputFiltersSchema,
  limit: z.coerce
    .number()
    .min(1)
    .max(LIMIT_DEFAULT)
    .prefault(MODULE_INDICATEURS_LIMIT_DEFAULT),
});

const moduleMesuresPaginationBaseSchema = getPaginationSchema([
  'modified_at',
  'created_at',
  'titre',
]);

const moduleMesuresPaginationSchema = z.object({
  ...moduleMesuresPaginationBaseSchema.shape,
  filtre: listActionsRequestOptionsSchema,
  limit: z.coerce
    .number()
    .min(1)
    .max(LIMIT_DEFAULT)
    .prefault(MODULE_MESURES_LIMIT_DEFAULT),
});

const personnelModuleTypeSchema = z.enum([
  'indicateur.list',
  'fiche_action.list',
  'mesure.list',
]);

export const personalDefaultModuleKeysSchema = z.enum([
  'actions-dont-je-suis-pilote',
  'sous-actions-dont-je-suis-pilote',
  'indicateurs-dont-je-suis-pilote',
  'mesures-dont-je-suis-pilote',
]);

export const moduleCommonSchemaInsert = z.object({
  id: z.uuid(),
  collectiviteId: z.number(),
  userId: z.uuid().nullish(),
  titre: z.string(),
  defaultKey: personalDefaultModuleKeysSchema,
  type: personnelModuleTypeSchema,
});

export const moduleCommonSchemaSelect = moduleCommonSchemaInsert
  .required()
  .extend({
    createdAt: z.iso.datetime(),
    modifiedAt: z.iso.datetime(),
  });

// MODULE INDICATEURS
export const moduleIndicateursSchema = z.object({
  type: z.literal(personnelModuleTypeSchema.enum['indicateur.list']),
  options: moduleIndicateursPaginationSchema,
});

export const moduleIndicateursSelectSchema = z.object({
  ...moduleCommonSchemaSelect.shape,
  ...moduleIndicateursSchema.shape,
});

export type ModuleIndicateursSelect = z.output<
  typeof moduleIndicateursSelectSchema
>;

// MODULE FICHES
export const moduleFichesSchema = z.object({
  type: z.literal(personnelModuleTypeSchema.enum['fiche_action.list']),
  options: moduleFichesPaginationSchema,
});

export const moduleFicheActionsSelectSchema = z.object({
  ...moduleCommonSchemaSelect.shape,
  ...moduleFichesSchema.shape,
});

// Use z.output to get type boolean for properties handled with `castToBoolean`.
export type ModuleFicheActionsSelect = z.output<
  typeof moduleFicheActionsSelectSchema
>;

// MODULE MESURES
export const moduleMesuresSchema = z.object({
  type: z.literal(personnelModuleTypeSchema.enum['mesure.list']),
  options: moduleMesuresPaginationSchema,
});

export const moduleMesuresSelectSchema =
  moduleCommonSchemaSelect.merge(moduleMesuresSchema);

export type ModuleMesuresSelect = z.infer<typeof moduleMesuresSelectSchema>;

export const moduleSchemaSelect = z.discriminatedUnion('type', [
  moduleIndicateursSelectSchema,
  moduleFicheActionsSelectSchema,
  moduleMesuresSelectSchema,
]);

export type ModuleSelect =
  | ModuleFicheActionsSelect
  | ModuleIndicateursSelect
  | ModuleMesuresSelect;

export const moduleSchemaInsert = z.discriminatedUnion('type', [
  moduleCommonSchemaInsert.extend(moduleIndicateursSchema.shape),
  moduleCommonSchemaInsert.extend(moduleFichesSchema.shape),
  moduleCommonSchemaInsert.extend(moduleMesuresSchema.shape),
]);

export type ModuleInsert = z.input<typeof moduleSchemaInsert>;

export type PersonalDefaultModuleKeys = z.infer<
  typeof personalDefaultModuleKeysSchema
>;

export type Filtre = ListDefinitionsInputFilters | ListFichesRequestFilters;

/**
 * Applique les valeurs par défaut du schéma Zod (notamment page et limit).
 */
export function parseModuleFromDb(module: unknown): ModuleSelect {
  return moduleSchemaSelect.parse(module);
}

/**
 * Retire page et limit des options avant persistance en BDD.
 */
export function prepareModuleForPersistence(module: ModuleInsert) {
  const parsed = moduleSchemaInsert.parse(module);
  const { page: _page, limit: _limit, ...persistedOptions } = parsed.options;

  return {
    ...parsed,
    options: persistedOptions,
  };
}
