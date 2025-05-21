import { useCollectiviteId } from '@/api/collectivites';
import { FetchOptions } from '@/api/indicateurs/domain';
import { DISABLE_AUTO_REFETCH } from '@/api/utils/react-query/query-options';
import { trpc } from '@/api/utils/trpc/client';
import Fuse from 'fuse.js';

/**
 * Charge la liste d'indicateurs en fonction du filtre donné
 *
 * @param filtre Paramètres de filtrage
 */
export const useFilteredIndicateurDefinitions = (
  options: FetchOptions,
  disableAutoRefresh?: boolean
) => {
  const collectiviteId = useCollectiviteId();

  // état par défaut pour supporter les anciens appels (infinite scroll)
  const disableRefresh = disableAutoRefresh ?? true;

  //A search which starts by # is an identifier search done on backend side
  const textSearch =
    options.filtre?.text && !options.filtre?.text.startsWith('#')
      ? options.filtre?.text
      : null;
  if (textSearch) {
    delete options.filtre?.text; // Delete it, search is done locally for now due to backend reasons
  }

  if (options.filtre?.estFavorisCollectivite) {
    // pour le filtre "favoris" (page "Indicateurs de la collectivité") il faut
    // désactiver l'agrégation pour que ce soit bien les indicateurs enfants mis
    // en favoris qui remontent et non pas leur parent
    options.filtre.withChildren = true;
  }

  const { data, error, isLoading } = trpc.indicateurs.list.useQuery(
    {
      collectiviteId,
      filtre: options.filtre ?? {},
      queryOptions: {
        page: options.page,
        limit: options.limit,
        sort: options.sort,
      },
    },
    disableRefresh ? DISABLE_AUTO_REFETCH : {}
  );

  if (error) {
    throw new Error(error.message);
  }

  const returnedObject = { data: data ?? [], isLoading };

  if (!data) {
    return returnedObject;
  }

  if (textSearch) {
    const fuse = new Fuse(data, {
      keys: ['titre'],
      threshold: 0.3,
      shouldSort: false,
      ignoreLocation: true,
    });
    return {
      ...returnedObject,
      data: fuse.search(textSearch).map((r) => r.item),
    };
  } else {
    return { ...returnedObject, data };
  }
};
