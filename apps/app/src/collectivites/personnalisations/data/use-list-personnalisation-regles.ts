import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

// charge les règles de personnalisation pour les actions données
export const useListPersonnalisationRegles = (
  actionIds: string[],
  enabled = true
) => {
  const trpc = useTRPC();
  const { data, ...other } = useQuery(
    trpc.collectivites.personnalisations.listRegles.queryOptions(
      { actionIds },
      { enabled }
    )
  );

  return { data: data ?? [], ...other };
};
