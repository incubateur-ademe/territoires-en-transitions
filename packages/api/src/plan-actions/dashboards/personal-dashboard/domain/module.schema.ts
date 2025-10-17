import {
  ListDefinitionsInputFilters,
  listDefinitionsInputFiltersSchema,
} from '@/domain/indicateurs';
import {
  ListFichesRequestFilters,
  listFichesRequestFiltersSchema,
} from '@/domain/plans';
import { listActionsRequestOptionsSchema } from '@/domain/referentiels';
import { getPaginationSchema } from '@/domain/utils';
import { z } from 'zod';

const moduleTypeSchema = z.enum([
  'indicateur.list',
  'fiche_action.list',
  'mesure.list',
]);

export const personalDefaultModuleKeysSchema = z.enum([
  'indicateurs-de-suivi-de-mes-plans',
  'indicateurs-dont-je-suis-pilote',
  'actions-dont-je-suis-pilote',
  'actions-recemment-modifiees',
  'mesures-dont-je-suis-pilote',
]);

export const moduleCommonSchemaInsert = z.object({
  id: z.string().uuid(),
  collectiviteId: z.number(),
  userId: z.string().uuid().nullish(),
  titre: z.string(),
  defaultKey: personalDefaultModuleKeysSchema,
  type: moduleTypeSchema,
});

export const moduleCommonSchemaSelect = moduleCommonSchemaInsert
  .required()
  .extend({
    createdAt: z.string().datetime(),
    modifiedAt: z.string().datetime(),
  });

// MODULE INDICATEURS
export const moduleIndicateursSchema = z.object({
  type: z.literal(moduleTypeSchema.enum['indicateur.list']),
  options: getPaginationSchema(['text', 'estComplet']).extend({
    filtre: listDefinitionsInputFiltersSchema,
  }),
});

export const moduleIndicateursSelectSchema = moduleCommonSchemaSelect.merge(
  moduleIndicateursSchema
);

export type ModuleIndicateursSelect = z.input<
  typeof moduleIndicateursSelectSchema
>;

// MODULE FICHES
export const moduleFichesSchema = z.object({
  type: z.literal(moduleTypeSchema.enum['fiche_action.list']),
  options: getPaginationSchema(['modified_at', 'created_at', 'titre']).extend({
    filtre: listFichesRequestFiltersSchema,
  }),
});

export const moduleFicheActionsSelectSchema =
  moduleCommonSchemaSelect.merge(moduleFichesSchema);

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
  moduleCommonSchemaInsert.merge(moduleIndicateursSchema),
  moduleCommonSchemaInsert.merge(moduleFichesSchema),
  moduleCommonSchemaInsert.merge(moduleMesuresSchema),
]);

export type ModuleInsert = z.input<typeof moduleSchemaInsert>;

export type PersonalDefaultModuleKeys = z.infer<
  typeof personalDefaultModuleKeysSchema
>;

export type Filtre = ListDefinitionsInputFilters | ListFichesRequestFilters;

type Props = {
  collectiviteId: number;
  userId: string;
  getPlanActionIds: () => Promise<number[]>;
};

/**
 * Retourne le module de base par défaut correspondant à la clé donnée.
 */
export async function getDefaultModule(
  defaultKey: string,
  { userId, collectiviteId, getPlanActionIds }: Props
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
      },
      createdAt: now,
      modifiedAt: now,
    } as ModuleFicheActionsSelect;
  }

  if (
    defaultKey ===
    personalDefaultModuleKeysSchema.enum['actions-recemment-modifiees']
  ) {
    return {
      id: crypto.randomUUID(),
      userId,
      collectiviteId,
      titre: 'Actions récemment modifiées',
      type: 'fiche_action.list',
      defaultKey,
      options: {
        filtre: {
          modifiedSince: 'last-90-days',
        },
        page: 1,
        limit: 4,
      },
      createdAt: now,
      modifiedAt: now,
    } as ModuleFicheActionsSelect;
  }

  if (
    defaultKey ===
    personalDefaultModuleKeysSchema.enum['indicateurs-de-suivi-de-mes-plans']
  ) {
    const planActionIds = await getPlanActionIds();

    return {
      id: crypto.randomUUID(),
      userId,
      collectiviteId,
      titre: 'Indicateurs de suivi de mes plans',
      type: 'indicateur.list',
      defaultKey:
        personalDefaultModuleKeysSchema.enum[
          'indicateurs-de-suivi-de-mes-plans'
        ],
      options: {
        // Le filtre par défaut affiche les indicateurs liés à tous les plans d'actions de la collectivité
        filtre: {
          planActionIds,
        },
        page: 1,
        limit: 4,
      },
      createdAt: now,
      modifiedAt: now,
    } as ModuleIndicateursSelect;
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
        limit: 4,
      },
      createdAt: now,
      modifiedAt: now,
    } as ModuleIndicateursSelect;
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
    } as ModuleMesuresSelect;
  }

  throw new Error(
    `La clé ${defaultKey} n'est pas une clé de module par défaut.`
  );
}
