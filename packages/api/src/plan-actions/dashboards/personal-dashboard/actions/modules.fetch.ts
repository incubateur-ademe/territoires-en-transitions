import { planActionsFetch } from '@/api/plan-actions';
import { DBClient } from '@/api/typeUtils';
import { objectToCamel } from 'ts-case-convert';
import {
  getDefaultModule,
  ModuleSelect,
  personalDefaultModuleKeysSchema,
} from '../domain/module.schema';

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
  // On crée une map des modules récupérés avec la clé ou l'id (si pas module par défaut) comme clé
  const fetchedModulesMap = new Map(
    fetchedModules.map((module) => [module.defaultKey || module.id, module])
  );

  // On ajoute les modules par défaut non présents dans les modules récupérés
  for (const defaultKey of personalDefaultModuleKeysSchema.options) {
    if (fetchedModulesMap.get(defaultKey)) {
      continue;
    }

    const defaultModule = await getDefaultModule(defaultKey, {
      ...props,
      getPlanActionIds: () =>
        planActionsFetch({ ...props }).then((data) =>
          data.plans.map((plan) => plan.id)
        ),
    });

    fetchedModulesMap.set(defaultKey, defaultModule);
  }

  return [
    fetchedModulesMap.get(
      personalDefaultModuleKeysSchema.enum['indicateurs-de-suivi-de-mes-plans']
    ) as ModuleSelect,
    fetchedModulesMap.get(
      personalDefaultModuleKeysSchema.enum['indicateurs-dont-je-suis-pilote']
    ) as ModuleSelect,
    fetchedModulesMap.get(
      personalDefaultModuleKeysSchema.enum['actions-dont-je-suis-pilote']
    ) as ModuleSelect,
    fetchedModulesMap.get(
      personalDefaultModuleKeysSchema.enum['actions-recemment-modifiees']
    ) as ModuleSelect,
  ];
}
