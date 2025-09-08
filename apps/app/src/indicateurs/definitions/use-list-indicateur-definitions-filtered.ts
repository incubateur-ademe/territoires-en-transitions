import { useCollectiviteId } from '@/api/collectivites';
import { DISABLE_AUTO_REFETCH } from '@/api/utils/react-query/query-options';
import { RouterInput, useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

export type ListDefinitionsInput =
  RouterInput['indicateurs']['definitions']['list'];

export type ListDefinitionsInputFilters = NonNullable<
  RouterInput['indicateurs']['definitions']['list']['filters']
>;

export const useListDefinitionsFiltered = (
  options: Omit<ListDefinitionsInput, 'collectiviteId'>,
  disableAutoRefresh?: boolean
) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  // état par défaut pour supporter les anciens appels (infinite scroll)
  const disableRefresh = disableAutoRefresh ?? true;

  //A search which starts by # is an identifier search done on backend side
  const textSearch =
    options.filters?.text && !options.filters?.text.startsWith('#')
      ? options.filters?.text
      : null;

  // if (textSearch) {
  //   if (options.filters) {
  //     delete options.filters.text; // Delete it, search is done locally for now due to backend reasons
  //     options.filters.withChildren = true;
  //   }
  // }

  if (options.filters?.estFavori) {
    // pour le filtre "favoris" (page "Indicateurs de la collectivité") il faut
    // désactiver l'agrégation pour que ce soit bien les indicateurs enfants mis
    // en favoris qui remontent et non pas leur parent
    options.filters.withChildren = true;
  }

  return useQuery(
    trpc.indicateurs.definitions.list.queryOptions(
      {
        collectiviteId,
        // Pour le moment pour éviter de changer la signature du endpoint trpc, on filtre les valeurs null.
        // Peut-être serait-il intéressant de faire évoluer le schéma de validation côté backend pour prendre en compte les valeurs null ?
        // Ou alors quand nuqs sera généralisé, on pourrait aussi mutualiser ce comportement de clean des valeurs null dans un hook dédié.
        filters: {
          ...Object.fromEntries(
            Object.entries(options.filters ?? {}).filter(
              ([, value]) => value !== null
            )
          ),
        },
        queryOptions: options.queryOptions,
      },
      disableRefresh ? DISABLE_AUTO_REFETCH : {}
    )
  );

  // if (error) {
  //   throw new Error(error.message);
  // }

  // const returnedObject = { data: data ?? [], isLoading };

  // if (!data) {
  //   return returnedObject;
  // }

  // if (textSearch) {
  //   const fuse = new Fuse(data, {
  //     keys: ['titre'],
  //     threshold: 0.3,
  //     shouldSort: true,
  //     ignoreDiacritics: true,
  //   });
  //   return {
  //     ...returnedObject,
  //     data: fuse.search(textSearch).map((r) => r.item),
  //   };
  // } else {
  //   return { ...returnedObject, data };
  // }
};
