import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type IndicateurDefinition =
  RouterOutput['indicateurs']['indicateurs']['list']['data'][number];

export const useGetIndicateur = (
  indicateurId: number | string,
  collectiviteId: number
) => {
  const trpc = useTRPC();
  const estIdReferentiel = typeof indicateurId === 'string';

  const { data, error, isLoading } = useQuery(
    trpc.indicateurs.indicateurs.list.queryOptions({
      collectiviteId,
      filters: {
        ...(estIdReferentiel
          ? { identifiantsReferentiel: [indicateurId] }
          : { indicateurIds: [indicateurId] }),
      },
    })
  );

  return { data: data?.data?.[0], error, isLoading };
};
