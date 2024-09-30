import { z } from 'zod';
import {
  fetchOptionsSchema as fichesFetchOptionsSchema,
  Filtre as FiltreFicheActions,
} from '@tet/api/plan-actions/fiche-resumes.list';
import {
  fetchOptionsSchema as indicateursFetchOptionsSchema,
  FetchFiltre as FiltreIndicateurs,
} from '@tet/api/indicateurs/domain/fetch_options.schema';

const moduleTypeSchema = z.enum(['indicateur.list', 'fiche_action.list']);

export const moduleCommonSchemaInsert = z.object({
  id: z.string().uuid(),
  collectiviteId: z.number(),
  userId: z.string().uuid().nullish(),
  titre: z.string(),
  slug: z.string(),
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
  options: fichesFetchOptionsSchema,
});

export const moduleFicheActionsSelectSchema =
  moduleCommonSchemaSelect.merge(moduleFichesSchema);

export type ModuleFicheActionsSelect = z.input<
  typeof moduleFicheActionsSelectSchema
>;

export const moduleSchemaSelect = z.discriminatedUnion('type', [
  moduleIndicateursSelectSchema,
  moduleFicheActionsSelectSchema,
]);

export const moduleSchemaInsert = z.discriminatedUnion('type', [
  moduleCommonSchemaInsert.merge(moduleIndicateursSchema),
  moduleCommonSchemaInsert.merge(moduleFichesSchema),
]);

export type ModuleSelect = z.input<typeof moduleSchemaSelect>;
export type ModuleInsert = z.input<typeof moduleSchemaInsert>;

export const defaultSlugsSchema = z.enum([
  'indicateurs-de-suivi-de-mes-plans',
  'actions-dont-je-suis-pilote',
  'actions-recemment-modifiees',
]);

export type Slug = z.infer<typeof defaultSlugsSchema>;

export type Filtre = FiltreIndicateurs | FiltreFicheActions;

type Props = {
  collectiviteId: number;
  userId: string;
  getPlanActionIds: () => Promise<number[]>;
};

/**
 * Retourne le module de base par défaut correspondant au slug donné.
 */
export async function getDefaultModule(
  slug: string,
  { userId, collectiviteId, getPlanActionIds }: Props
) {
  const now = new Date().toISOString();

  if (slug === defaultSlugsSchema.enum['actions-dont-je-suis-pilote']) {
    return {
      id: crypto.randomUUID(),
      userId,
      collectiviteId,
      titre: 'Actions dont je suis le pilote',
      type: 'fiche_action.list',
      slug,
      options: {
        filtre: {
          utilisateurPiloteIds: [userId],
        },
      },
      createdAt: now,
      modifiedAt: now,
    } as ModuleFicheActionsSelect;
  }

  if (slug === defaultSlugsSchema.enum['actions-recemment-modifiees']) {
    return {
      id: crypto.randomUUID(),
      userId,
      collectiviteId,
      titre: 'Actions récemment modifiées',
      type: 'fiche_action.list',
      slug,
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

  if (slug === defaultSlugsSchema.enum['indicateurs-de-suivi-de-mes-plans']) {
    const planActionIds = await getPlanActionIds();

    return {
      id: crypto.randomUUID(),
      userId,
      collectiviteId,
      titre: 'Indicateurs de suivi de mes plans',
      type: 'indicateur.list',
      slug: defaultSlugsSchema.enum['indicateurs-de-suivi-de-mes-plans'],
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

  throw new Error(`Le slug ${slug} n'est pas un slug de module par défaut.`);
}
