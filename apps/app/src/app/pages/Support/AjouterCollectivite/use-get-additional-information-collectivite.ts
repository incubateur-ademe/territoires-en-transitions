import { useQuery } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';

export type CollectiviteInput =
  RouterInput['collectivites']['collectivites']['getAdditionalInformation'];

export const useGetAdditionalInformationCollectivite = (
  collectivite: RouterInput['collectivites']['collectivites']['getAdditionalInformation']
) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.collectivites.getAdditionalInformation.queryOptions(
      collectivite,
      { enabled: false }
    )
  );
};
