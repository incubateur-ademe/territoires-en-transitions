import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useGetIndicateur = (
  indicateurId: number | string,
  collectiviteId: number
) => {
  const trpc = useTRPC();
  const estIdReferentiel = typeof indicateurId === 'string';

  const { data, ...other } = useQuery(
    trpc.indicateurs.indicateurs.list.queryOptions({
      collectiviteId,
      filters: {
        ...(estIdReferentiel
          ? { identifiantsReferentiel: [indicateurId] }
          : { indicateurIds: [indicateurId] }),
      },
    })
  );

  return { data: data?.data?.[0], ...other };
};
