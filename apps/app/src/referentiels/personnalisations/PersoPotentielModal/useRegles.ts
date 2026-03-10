import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

// charge les règles de personnalisation pour une action donnée
export const useRegles = (actionId: string) => {
  const trpc = useTRPC();
  const { data, ...other } = useQuery(
    trpc.collectivites.personnalisations.listRegles.queryOptions(
      {
        actionIds: [actionId],
      },
      { enabled: Boolean(actionId?.trim()) }
    )
  );

  return { data: data ?? [], ...other };
};
