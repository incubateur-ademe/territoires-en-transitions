import { planActionsFetch } from '@/api/plan-actions';
import { DBClient } from '@/api/typeUtils';
import { objectToCamel } from 'ts-case-convert';
import {
  ModuleFicheActionsSelect,
  ModuleIndicateursSelect,
  PersonalDefaultModuleKeys,
  getDefaultModule,
} from '../domain/module.schema';

/**
 * Fetch un module spécifique du tableau de bord d'une collectivité et d'un user.
 */
export async function moduleFetch<S extends PersonalDefaultModuleKeys>({
  dbClient,
  collectiviteId,
  userId,
  defaultModuleKey,
}: {
  dbClient: DBClient;
  collectiviteId: number;
  userId: string;
  defaultModuleKey: S;
}) {
  try {
    const query = dbClient
      .from('tableau_de_bord_module')
      .select('*')
      .eq('collectivite_id', collectiviteId)
      .eq('user_id', userId)
      .eq('default_key', defaultModuleKey)
      .limit(1);

    const { data: rawData, error } = await query;

    if (error) {
      throw error;
    }

    const data = objectToCamel(rawData);

    const tdbModule = data.length
      ? data[0]
      : await getDefaultModule(defaultModuleKey, {
          collectiviteId,
          userId,
          getPlanActionIds: () =>
            planActionsFetch({ dbClient, collectiviteId }).then(({ plans }) =>
              plans.map((plan) => plan.id)
            ),
        });

    if (
      defaultModuleKey === 'indicateurs-de-suivi-de-mes-plans' ||
      defaultModuleKey === 'indicateurs-dont-je-suis-pilote'
    ) {
      return tdbModule as ModuleIndicateursSelect;
    }

    if (
      defaultModuleKey === 'actions-dont-je-suis-pilote' ||
      defaultModuleKey === 'actions-recemment-modifiees'
    ) {
      return tdbModule as ModuleFicheActionsSelect;
    }

    throw new Error(`Module: clé inconnue '${defaultModuleKey}'`);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
