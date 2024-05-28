import {objectToCamel} from 'ts-case-convert';
import {z} from 'zod';
import {DBClient} from '../../../typeUtils';
import {getDefaultModules, moduleSchemaSelect} from '../domain/module.schema';

const outputSchema = moduleSchemaSelect.array();
type Output = z.infer<typeof outputSchema>;

type Props = {
  dbClient: DBClient;
  collectiviteId: number;
  userId: string | null;
};

/**
 * Fetch les modules du tableau de bord d'une collectivité et d'un user.
 */
export async function modulesFetch({dbClient, collectiviteId, userId}: Props) {
  try {
    const {data, error} = await dbClient
      .from('tableau_de_bord_module')
      .select('*')
      .eq('collectivite_id', collectiviteId)
      .eq('user_id', userId)
      .returns<Output>();

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
