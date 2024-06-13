import {objectToCamel} from 'ts-case-convert';
import {DBClient} from '../../../typeUtils';
import {
  ModuleFicheActionsSelect,
  ModuleIndicateursSelect,
  Slug,
} from '../domain/module.schema';

export type ReturnType<S extends Slug> =
  S extends 'indicateurs-de-suivi-de-mes-plans'
    ? ModuleIndicateursSelect
    : ModuleFicheActionsSelect;

/**
 * Fetch un module spécifique du tableau de bord d'une collectivité et d'un user.
 */
export async function moduleFetch<S extends Slug>({
  dbClient,
  collectiviteId,
  userId,
  slug,
}: {
  dbClient: DBClient;
  collectiviteId: number;
  userId: string;
  slug: S;
}): Promise<ReturnType<S>> {
  try {
    const query = dbClient
      .from('tableau_de_bord_module')
      .select('*')
      .eq('collectivite_id', collectiviteId)
      .eq('user_id', userId)
      .eq('slug', slug)
      .limit(1)
      .single();

    const {data: rawData, error} = await query;

    if (error) {
      throw error;
    }

    const data = objectToCamel(rawData);

    if (slug === 'indicateurs-de-suivi-de-mes-plans') {
      return data as ReturnType<typeof slug>;
    }

    if (
      slug === 'actions-dont-je-suis-pilote' ||
      slug === 'actions-recemment-modifiees'
    ) {
      return data as ReturnType<typeof slug>;
    }

    throw new Error(`Module: Slug inconnu '${slug}'`);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
