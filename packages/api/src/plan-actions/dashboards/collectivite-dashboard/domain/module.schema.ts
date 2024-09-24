import {
  fetchOptionsSchema as fichesFetchOptionsSchema,
  Filtre as FiltreFicheActions,
} from '@tet/api/plan-actions/fiche-resumes.list';
import {
  FetchFilter as FetchFilterPlanActions,
  fetchOptionsSchema as planActionsFetchOptionsSchema,
} from '@tet/api/plan-actions/plan-actions.list/domain/fetch-options.schema';
import { z } from 'zod';

const moduleTypeSchema = z.enum([
  // "Avancée des plans d'actions de la collectivité"
  'plan-action.list',
  // "Suivi de l'avancement des actions"
  'fiche-action.count-by-status',
]);

export const moduleCommonSchemaInsert = z.object({
  id: z.string().uuid(),
  collectiviteId: z.number(),
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

export const modulePlanActionListSchema = z.object({
  type: z.literal(moduleTypeSchema.enum['plan-action.list']),
  options: planActionsFetchOptionsSchema,
});

export const modulePlanActionListSelectSchema = moduleCommonSchemaSelect.merge(
  modulePlanActionListSchema
);

export type ModulePlanActionListSelect = z.input<
  typeof modulePlanActionListSelectSchema
>;

export const moduleFicheActionCountByStatusSchema = z.object({
  type: z.literal(moduleTypeSchema.enum['fiche-action.count-by-status']),
  options: fichesFetchOptionsSchema,
});

export const moduleFicheActionCountByStatusSelectSchema =
  moduleCommonSchemaSelect.merge(moduleFicheActionCountByStatusSchema);

export type ModuleFicheActionCountByStatusSelect = z.input<
  typeof moduleFicheActionCountByStatusSelectSchema
>;

export const moduleSchemaSelect = z.discriminatedUnion('type', [
  modulePlanActionListSelectSchema,
  moduleFicheActionCountByStatusSelectSchema,
]);

export const moduleSchemaInsert = z.discriminatedUnion('type', [
  moduleCommonSchemaInsert.merge(modulePlanActionListSchema),
  moduleCommonSchemaInsert.merge(moduleFicheActionCountByStatusSchema),
]);

export type ModuleSelect = z.input<typeof moduleSchemaSelect>;
export type ModuleInsert = z.input<typeof moduleSchemaInsert>;

export const defaultSlugsSchema = z.enum([
  'suivi-plan-actions',
  'fiche-actions-par-statut',
]);

export type Slug = z.infer<typeof defaultSlugsSchema>;

export type Filter = FetchFilterPlanActions | FiltreFicheActions;

type Props = {
  collectiviteId: number;
  getPlanActionIds: () => Promise<number[]>;
};

/**
 * Retourne le module de base par défaut correspondant au slug donné.
 */
export async function getDefaultModule(
  slug: string,
  { collectiviteId, getPlanActionIds }: Props
) {
  const now = new Date().toISOString();
  const planActionIds = await getPlanActionIds();

  if (slug === defaultSlugsSchema.enum['suivi-plan-actions']) {
    return {
      id: crypto.randomUUID(),
      collectiviteId,
      titre: "Avancée des plans d'action de la collectivité",
      type: 'plan-action.list',
      slug,
      options: {
        filtre: {
          // Le filtre par défaut se base sur tous les plans d'actions de la collectivité
          planActionIds,
        },
      },
      createdAt: now,
      modifiedAt: now,
    } as ModulePlanActionListSelect;
  }

  if (slug === defaultSlugsSchema.enum['fiche-actions-par-statut']) {
    return {
      id: crypto.randomUUID(),
      collectiviteId,
      titre: 'Actions récemment modifiées',
      type: 'fiche-action.count-by-status',
      slug,
      options: {
        filtre: {
          // Le filtre par défaut se base sur tous les plans d'actions de la collectivité
          planActionIds,
        },
        page: 1,
      },
      createdAt: now,
      modifiedAt: now,
    } as ModuleFicheActionCountByStatusSelect;
  }

  throw new Error(`Le slug ${slug} n'est pas un slug de module par défaut.`);
}
