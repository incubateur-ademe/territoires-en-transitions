import { objectToCamel } from 'ts-case-convert';
import { planActionsFetch } from '@tet/api/plan-actions';
import {
  ModuleSelect,
  defaultSlugsSchema,
  getDefaultModule,
} from '../domain/module.schema';
import { DBClient } from '@tet/api/typeUtils';

export type FetchReturnValue = Array<ModuleSelect>;

type Props = {
  dbClient: DBClient;
  collectiviteId: number;
};

/**
 * Fetch les modules du tableau de bord d'une collectivité et d'un user.
 */
export async function modulesFetch({ dbClient, collectiviteId }: Props) {
  try {
    const query = dbClient
      .from('tableau_de_bord_module')
      .select('*')
      .eq('collectivite_id', collectiviteId)
      .is('user_id', null);

    const { data: rawData, error } = await query;

    if (error) {
      throw error;
    }

    const data = objectToCamel(rawData) as unknown as FetchReturnValue;

    const modules = await mergeWithDefaultModules(data, {
      dbClient,
      collectiviteId,
    });

    return { data: modules };
  } catch (error) {
    console.error(error);
    return { error };
  }
}

async function mergeWithDefaultModules(
  fetchedModules: FetchReturnValue,
  props: Props
) {
  // On crée une map des modules récupérés avec le slug comme clé
  const fetchedModulesMap = new Map(
    fetchedModules.map((module) => [module.slug, module])
  );

  // On ajoute les modules par défaut non présents dans les modules récupérés
  for (const slug of defaultSlugsSchema.options) {
    if (fetchedModulesMap.get(slug)) {
      continue;
    }

    const defaultModule = await getDefaultModule(slug, {
      ...props,
      getPlanActionIds: () =>
        planActionsFetch(props).then((data) =>
          data.plans.map((plan) => plan.id)
        ),
    });

    fetchedModulesMap.set(slug, defaultModule);
  }

  // Ordonne manuellement les modules pour qu'ils apparaissent dans l'ordre voulu
  return [
    fetchedModulesMap.get(
      defaultSlugsSchema.enum['suivi-plan-actions']
    ) as ModuleSelect,
    fetchedModulesMap.get(
      defaultSlugsSchema.enum['fiche-actions-par-statut']
    ) as ModuleSelect,
  ];
}
