import { objectToCamel } from 'ts-case-convert';
import { planActionsFetch } from '@tet/api/plan-actions';
import {
  ModuleSelect,
  defaultSlugsSchema,
  getDefaultModule,
} from '../domain/module.schema';
import { DBClient } from '@tet/api/typeUtils';

export type ModuleFetchReturnValue = Array<ModuleSelect>;

type Props = {
  dbClient: DBClient;
  collectiviteId: number;
  userId: string;
};

/**
 * Fetch les modules du tableau de bord d'une collectivité et d'un user.
 */
export async function modulesFetch({
  dbClient,
  collectiviteId,
  userId,
}: Props) {
  try {
    const query = dbClient
      .from('tableau_de_bord_module')
      .select('*')
      .eq('collectivite_id', collectiviteId)
      .eq('user_id', userId);

    const { data: rawData, error } = await query;

    if (error) {
      throw error;
    }

    const data = objectToCamel(rawData) as ModuleFetchReturnValue;

    const modules = await mergeWithDefaultModules(data, {
      dbClient,
      userId,
      collectiviteId,
    });

    return { data: modules };
  } catch (error) {
    console.error(error);
    return { error };
  }
}

async function mergeWithDefaultModules(
  fetchedModules: ModuleFetchReturnValue,
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
        planActionsFetch({ ...props }).then((data) =>
          data.plans.map((plan) => plan.id)
        ),
    });

    fetchedModulesMap.set(slug, defaultModule);
  }

  // Ordonne manuellement les modules pour qu'ils apparaissent dans l'ordre voulu
  return [
    fetchedModulesMap.get(
      defaultSlugsSchema.enum['indicateurs-de-suivi-de-mes-plans']
    ) as ModuleSelect,
    fetchedModulesMap.get(
      defaultSlugsSchema.enum['actions-dont-je-suis-pilote']
    ) as ModuleSelect,
    fetchedModulesMap.get(
      defaultSlugsSchema.enum['actions-recemment-modifiees']
    ) as ModuleSelect,
  ];
}
