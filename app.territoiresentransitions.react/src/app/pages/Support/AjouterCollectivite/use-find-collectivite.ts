import { RouterInput, trpc } from '@/api/utils/trpc/client';

export type CollectiviteInput =
  RouterInput['collectivites']['collectivites']['getAdditionalInformation'];

export const useFindCollectivite = (collectivite: CollectiviteInput) =>
  trpc.collectivites.collectivites.find.useQuery(collectivite, {
    enabled: false,
  });
