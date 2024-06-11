import {z} from 'zod';
import {fetchOptionsSchema as fichesFetchOptionsSchema} from '../../../fiche_actions/resumes.list/domain/fetch_options.schema';
import {fetchOptionsSchema as indicateursFetchOptionsSchema} from '../../../indicateurs/indicateurs.list/domain/fetch_options.schema';

export const moduleCommonSchemaInsert = z.object({
  id: z.string().uuid(),
  collectiviteId: z.number(),
  userId: z.string().uuid().nullish(),
  titre: z.string(),
  slug: z.string(),
});

export const moduleCommonSchemaSelect = moduleCommonSchemaInsert
  .required()
  .extend({
    createdAt: z.string().datetime(),
    modifiedAt: z.string().datetime(),
  });

export const moduleIndicateursSchema = z.object({
  type: z.literal('indicateur.list'),
  options: indicateursFetchOptionsSchema,
});

export const moduleFicheActionsSchema = z.object({
  type: z.literal('fiche_action.list'),
  options: fichesFetchOptionsSchema,
});

export const moduleSchemaSelect = z.discriminatedUnion('type', [
  moduleIndicateursSchema.merge(moduleCommonSchemaSelect),
  moduleFicheActionsSchema.merge(moduleCommonSchemaSelect),
]);

export const moduleSchemaInsert = z.discriminatedUnion('type', [
  moduleIndicateursSchema.merge(moduleCommonSchemaInsert),
  moduleFicheActionsSchema.merge(moduleCommonSchemaInsert),
]);

export type ModuleSelect = z.input<typeof moduleSchemaSelect>;
export type ModuleInsert = z.input<typeof moduleSchemaInsert>;

export const defaultSlugsSchema = z.enum([
  'indicateurs-de-suivi-de-mes-plans',
  'actions-dont-je-suis-pilote',
  'actions-recemment-modifiees',
]);

type Props = {
  collectiviteId: number;
  userId: string;
};

/**
 * Retourne les 3 modules de base par défaut.
 */
export function getDefaultModules({userId, collectiviteId}: Props) {
  const now = new Date().toISOString();

  const indicateurs: ModuleSelect = {
    id: crypto.randomUUID(),
    userId,
    collectiviteId,
    titre: 'Indicateurs de suivi de mes plans',
    type: 'indicateur.list',
    slug: defaultSlugsSchema.enum['indicateurs-de-suivi-de-mes-plans'],
    options: {
      filtre: {
      },
    },
    createdAt: now,
    modifiedAt: now,
  };

  const actionsDontJeSuisPilote: ModuleSelect = {
    id: crypto.randomUUID(),
    userId,
    collectiviteId,
    titre: 'Actions dont je suis pilote',
    type: 'fiche_action.list',
    slug: defaultSlugsSchema.enum['actions-dont-je-suis-pilote'],
    options: {
      filtre: {
        utilisateurPiloteIds: [userId],
      },
    },
    createdAt: now,
    modifiedAt: now,
  };

  const actionsRecentlyModified: ModuleSelect = {
    id: crypto.randomUUID(),
    userId,
    collectiviteId,
    titre: 'Actions récemment modifiées',
    type: 'fiche_action.list',
    slug: defaultSlugsSchema.enum['actions-recemment-modifiees'],
    options: {
      filtre: {
        modifiedSince: 'last-30-days',
      },
    },
    createdAt: now,
    modifiedAt: now,
  };

  return [indicateurs, actionsDontJeSuisPilote, actionsRecentlyModified];
}
