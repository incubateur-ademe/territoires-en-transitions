import {
  ListDefinitionsInputFilters,
  listDefinitionsInputFiltersSchema,
} from '@tet/domain/indicateurs';
import {
  ListFichesRequestFilters,
  listFichesRequestFiltersSchema,
} from '@tet/domain/plans';
import { listActionsRequestOptionsSchema } from '@tet/domain/referentiels';
import { getPaginationSchema } from '@tet/domain/utils';
import { z } from 'zod';

const moduleTypeSchema = z.enum([
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
  type: moduleTypeSchema,
});

export const moduleCommonSchemaSelect = moduleCommonSchemaInsert
  .required()
  .extend({
    createdAt: z.iso.datetime(),
    modifiedAt: z.iso.datetime(),
  });

// MODULE INDICATEURS
export const moduleIndicateursSchema = z.object({
  type: z.literal(moduleTypeSchema.enum['indicateur.list']),
  options: getPaginationSchema(['text', 'estComplet']).extend({
    filtre: listDefinitionsInputFiltersSchema,
  }),
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
  type: z.literal(moduleTypeSchema.enum['fiche_action.list']),
  options: getPaginationSchema(['modified_at', 'created_at', 'titre']).extend({
    filtre: listFichesRequestFiltersSchema,
  }),
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
  type: z.literal(moduleTypeSchema.enum['mesure.list']),
  options: getPaginationSchema(['modified_at', 'created_at', 'titre']).extend({
    filtre: listActionsRequestOptionsSchema,
  }),
});

export const moduleMesuresSelectSchema =
  moduleCommonSchemaSelect.merge(moduleMesuresSchema);

export type ModuleMesuresSelect = z.input<typeof moduleMesuresSelectSchema>;

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

type Props = {
  collectiviteId: number;
  userId: string;
};

/**
 * Retourne le module de base par défaut correspondant à la clé donnée.
 */
export async function getDefaultModule(
  defaultKey: string,
  { userId, collectiviteId }: Props
) {
  const now = new Date().toISOString();

  if (
    defaultKey ===
    personalDefaultModuleKeysSchema.enum['actions-dont-je-suis-pilote']
  ) {
    return {
      id: crypto.randomUUID(),
      userId,
      collectiviteId,
      titre: 'Actions dont je suis le pilote',
      type: 'fiche_action.list',
      defaultKey,
      options: {
        filtre: {
          utilisateurPiloteIds: [userId],
        },
        page: 1,
        limit: 4,
      },
      createdAt: now,
      modifiedAt: now,
    } satisfies ModuleFicheActionsSelect;
  }

  if (
    defaultKey ===
    personalDefaultModuleKeysSchema.enum['sous-actions-dont-je-suis-pilote']
  ) {
    return {
      id: crypto.randomUUID(),
      userId,
      collectiviteId,
      titre: 'Sous actions pilotées',
      type: 'fiche_action.list',
      defaultKey,
      options: {
        filtre: {
          utilisateurPiloteIds: [userId],
          onlyChildren: true,
        },
        page: 1,
        limit: 10,
      },
      createdAt: now,
      modifiedAt: now,
    } satisfies ModuleFicheActionsSelect;
  }

  if (
    defaultKey ===
    personalDefaultModuleKeysSchema.enum['indicateurs-dont-je-suis-pilote']
  ) {
    return {
      id: crypto.randomUUID(),
      userId,
      collectiviteId,
      titre: 'Indicateurs dont je suis le pilote',
      type: 'indicateur.list',
      defaultKey:
        personalDefaultModuleKeysSchema.enum['indicateurs-dont-je-suis-pilote'],
      options: {
        filtre: {
          utilisateurPiloteIds: [userId],
        },
        page: 1,
        limit: 3,
      },
      createdAt: now,
      modifiedAt: now,
    } satisfies ModuleIndicateursSelect;
  }

  if (
    defaultKey ===
    personalDefaultModuleKeysSchema.enum['mesures-dont-je-suis-pilote']
  ) {
    return {
      id: crypto.randomUUID(),
      userId,
      collectiviteId,
      titre: 'Mesures des référentiels dont je suis le pilote',
      type: 'mesure.list',
      defaultKey:
        personalDefaultModuleKeysSchema.enum['mesures-dont-je-suis-pilote'],
      options: {
        filtre: {
          utilisateurPiloteIds: [userId],
        },
        page: 1,
        limit: 4,
      },
      createdAt: now,
      modifiedAt: now,
    } satisfies ModuleMesuresSelect;
  }

  throw new Error(
    `La clé ${defaultKey} n'est pas une clé de module par défaut.`
  );
}
