import { RouterInput, trpc } from '@/api/utils/trpc/client';

export type CollectiviteInput =
  RouterInput['collectivites']['collectivites']['complete'];

export const useFindCollectivite = (collectivite: CollectiviteInput) =>
  trpc.collectivites.collectivites.find.useQuery(collectivite, {
    enabled: false,
  });
