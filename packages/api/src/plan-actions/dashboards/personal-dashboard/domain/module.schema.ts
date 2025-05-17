import {
  FetchFiltre as FiltreIndicateurs,
  fetchOptionsSchema as indicateursFetchOptionsSchema,
} from '@/api/indicateurs';
import {
  ListFichesRequestFilters,
  listFichesRequestFiltersSchema,
} from '@/domain/plans/fiches';
import { getPaginationSchema } from '@/domain/utils';
import { z } from 'zod';

const moduleTypeSchema = z.enum(['indicateur.list', 'fiche_action.list']);

export const moduleCommonSchemaInsert = z.object({
  id: z.string().uuid(),
  collectiviteId: z.number(),
  userId: z.string().uuid().nullish(),
  titre: z.string(),
  defaultKey: z.string(),
  type: moduleTypeSchema,
});

export const moduleCommonSchemaSelect = moduleCommonSchemaInsert
  .required()
  .extend({
    createdAt: z.string().datetime(),
    modifiedAt: z.string().datetime(),
  });

export const moduleIndicateursSchema = z.object({
  type: z.literal(moduleTypeSchema.enum['indicateur.list']),
  options: indicateursFetchOptionsSchema,
});

export const moduleIndicateursSelectSchema = moduleCommonSchemaSelect.merge(
  moduleIndicateursSchema
);

export type ModuleIndicateursSelect = z.input<
  typeof moduleIndicateursSelectSchema
>;

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

export const moduleSchemaSelect = z.discriminatedUnion('type', [
  moduleIndicateursSelectSchema,
  moduleFicheActionsSelectSchema,
]);

export type ModuleSelect = ModuleFicheActionsSelect | ModuleIndicateursSelect;

export const moduleSchemaInsert = z.discriminatedUnion('type', [
  moduleCommonSchemaInsert.merge(moduleIndicateursSchema),
  moduleCommonSchemaInsert.merge(moduleFichesSchema),
]);

export type ModuleInsert = z.input<typeof moduleSchemaInsert>;

export const personalDefaultModuleKeysSchema = z.enum([
  'indicateurs-de-suivi-de-mes-plans',
  'actions-dont-je-suis-pilote',
  'actions-recemment-modifiees',
]);

export type PersonalDefaultModuleKeys = z.infer<
  typeof personalDefaultModuleKeysSchema
>;

export type Filtre = FiltreIndicateurs | ListFichesRequestFilters;

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
          // utilisateurPiloteIds: [userId],
        },
        page: 1,
        limit: 4,
      },
      createdAt: now,
      modifiedAt: now,
    } as ModuleIndicateursSelect;
  }

  throw new Error(
    `La clé ${defaultKey} n'est pas une clé de module par défaut.`
  );
}
