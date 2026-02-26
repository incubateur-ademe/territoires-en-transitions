import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

export type Membre =
  RouterOutput['collectivites']['membres']['list']['membres'][number];

/**
 * Donne accès à la liste des membres de la collectivité courante.
 */
export const useListMembres = () => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.membres.list.queryOptions(
      { collectiviteId },
      {
        enabled: !!collectiviteId,
        select(result) {
          return result.membres;
        },
      }
    )
  );
};
