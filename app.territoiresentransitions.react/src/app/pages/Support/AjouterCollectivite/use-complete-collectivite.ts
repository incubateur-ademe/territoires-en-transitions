import { RouterInput, trpc } from '@/api/utils/trpc/client';

export type CollectiviteInput =
  RouterInput['collectivites']['collectivites']['complete'];

export const useCompleteCollectivite = (collectivite: CollectiviteInput) =>
  trpc.collectivites.collectivites.complete.useQuery(collectivite, {
    enabled: false,
  });
