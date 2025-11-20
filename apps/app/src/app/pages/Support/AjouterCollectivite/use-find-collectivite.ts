import { useQuery } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';

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
