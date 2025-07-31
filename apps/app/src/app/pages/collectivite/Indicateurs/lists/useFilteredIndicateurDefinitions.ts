import { useCollectiviteId } from '@/api/collectivites';
import { DISABLE_AUTO_REFETCH } from '@/api/utils/react-query/query-options';
import { useTRPC } from '@/api/utils/trpc/client';
import { ListIndicateursRequest } from '@/domain/indicateurs';
import { useQuery } from '@tanstack/react-query';
import Fuse from 'fuse.js';

/**
 * Charge la liste d'indicateurs en fonction du filtre donné
 *
 * @param filtre Paramètres de filtrage
 */
export const useFilteredIndicateurDefinitions = (
  options: Omit<ListIndicateursRequest, 'collectiviteId'>,
  disableAutoRefresh?: boolean
) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  // état par défaut pour supporter les anciens appels (infinite scroll)
  const disableRefresh = disableAutoRefresh ?? true;

  //A search which starts by # is an identifier search done on backend side
  const textSearch =
    options.filtre?.text && !options.filtre?.text.startsWith('#')
      ? options.filtre?.text
      : null;
  if (textSearch) {
    if (options.filtre) {
      delete options.filtre.text; // Delete it, search is done locally for now due to backend reasons
      options.filtre.withChildren = true;
    }
  }

  if (options.filtre?.estFavorisCollectivite) {
    // pour le filtre "favoris" (page "Indicateurs de la collectivité") il faut
    // désactiver l'agrégation pour que ce soit bien les indicateurs enfants mis
    // en favoris qui remontent et non pas leur parent
    options.filtre.withChildren = true;
  }

  const { data, error, isLoading } = useQuery(
    trpc.indicateurs.list.queryOptions(
      {
        collectiviteId,
        // Pour le moment pour éviter de changer la signature du endpoint trpc, on filtre les valeurs null.
        // Peut-être serait-il intéressant de faire évoluer le schéma de validation côté backend pour prendre en compte les valeurs null ?
        // Ou alors quand nuqs sera généralisé, on pourrait aussi mutualiser ce comportement de clean des valeurs null dans un hook dédié.
        filtre: Object.fromEntries(
          Object.entries(options.filtre ?? {}).filter(
            ([, value]) => value !== null
          )
        ),
        queryOptions: options.queryOptions ?? {},
      },
      disableRefresh ? DISABLE_AUTO_REFETCH : {}
    )
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
      shouldSort: true,
      ignoreDiacritics: true,
    });
    return {
      ...returnedObject,
      data: fuse.search(textSearch).map((r) => r.item),
    };
  } else {
    return { ...returnedObject, data };
  }
};
