import { RouterInput, useTRPC } from '@/api';
import { useQuery } from '@tanstack/react-query';

export type CollectiviteInput =
  RouterInput['collectivites']['collectivites']['getAdditionalInformation'];

export const useFindCollectivite = (collectivite: CollectiviteInput) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.collectivites.find.queryOptions(collectivite, {
      enabled: false,
    })
  );
};
