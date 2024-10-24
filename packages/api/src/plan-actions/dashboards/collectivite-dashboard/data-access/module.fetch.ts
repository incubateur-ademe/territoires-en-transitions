import { objectToCamel } from 'ts-case-convert';
import {
  ModuleFicheActionCountByStatusSelect,
  ModulePlanActionListSelect,
  Slug,
  getDefaultModule,
} from '../domain/module.schema';
import { DBClient } from '@tet/api/typeUtils';
import { planActionsFetch } from '@tet/api/plan-actions';

export type ReturnType<S extends Slug> = S extends 'suivi-plan-actions'
  ? ModulePlanActionListSelect
  : ModuleFicheActionCountByStatusSelect;

/**
 * Fetch un module spécifique du tableau de bord d'une collectivité et d'un user.
 */
export async function moduleFetch<S extends Slug>({
  dbClient,
  collectiviteId,
  slug,
}: {
  dbClient: DBClient;
  collectiviteId: number;
  slug: S;
}): Promise<ReturnType<S>> {
  try {
    const query = dbClient
      .from('tableau_de_bord_module')
      .select('*')
      .eq('collectivite_id', collectiviteId)
      .eq('slug', slug)
      .limit(1);

    const { data: rawData, error } = await query;

    if (error) {
      throw error;
    }

    const data = objectToCamel(rawData);

    const tdbModule = data.length
      ? data[0]
      : await getDefaultModule(slug, {
          collectiviteId,
          getPlanActionIds: () =>
            planActionsFetch({ dbClient, collectiviteId }).then(({ plans }) =>
              plans.map((plan) => plan.id)
            ),
        });

    if (slug === 'suivi-plan-actions' || slug === 'fiche-actions-par-statut') {
      return tdbModule as ReturnType<typeof slug>;
    }

    throw new Error(`Module: Slug inconnu '${slug}'`);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
