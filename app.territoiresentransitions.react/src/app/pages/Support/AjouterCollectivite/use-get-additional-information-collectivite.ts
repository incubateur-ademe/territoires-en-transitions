import { RouterInput, trpc } from '@/api/utils/trpc/client';

export type CollectiviteInput =
  RouterInput['collectivites']['collectivites']['getAdditionalInformation'];

export const useGetAdditionalInformationCollectivite = (collectivite: CollectiviteInput) =>
  trpc.collectivites.collectivites.getAdditionalInformation.useQuery(collectivite, {
    enabled: false,
  });
