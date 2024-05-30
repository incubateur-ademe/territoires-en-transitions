import {objectToCamel} from 'ts-case-convert';
import {DBClient} from '../../../typeUtils';
import {ModuleSelect, getDefaultModules} from '../domain/module.schema';

type Output = Array<ModuleSelect>;

type Props = {
  dbClient: DBClient;
  collectiviteId: number;
  userId: string;
};

/**
 * Fetch les modules du tableau de bord d'une collectivité et d'un user.
 */
export async function modulesFetch({dbClient, collectiviteId, userId}: Props) {
  try {
    const query = dbClient
      .from('tableau_de_bord_module')
      .select('*')
      .eq('collectivite_id', collectiviteId)
      .eq('user_id', userId);

    const {data, error} = await query.returns<Output>();

    if (error) {
      throw error;
    }

    const defaultModules = getDefaultModules({userId, collectiviteId});

    if (data.length === 0) {
      return {
        data: defaultModules,
      };
    }

    const modules = mergeWithDefaultModules(data, defaultModules);

    return {data: objectToCamel(modules)};
  } catch (error) {
    console.error(error);
    return {error};
  }
}

function mergeWithDefaultModules(
  fetchedModules: Output,
  defaultModules: Output
) {
  // On crée une map des modules récupérés avec le slug comme clé
  const fetchedModulesMap = new Map(
    fetchedModules.map(module => [module.slug, module])
  );

  // On ajoute les modules par défaut non présents dans les modules récupérés
  defaultModules.forEach(defaultModule => {
    fetchedModulesMap.set(
      defaultModule.slug,
      fetchedModulesMap.get(defaultModule.slug) || defaultModule
    );
  });

  return Array.from(fetchedModulesMap.values());
}
