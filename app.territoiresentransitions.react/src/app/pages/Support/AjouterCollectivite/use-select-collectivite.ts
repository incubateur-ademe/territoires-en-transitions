import { RouterOutput, trpc } from '@/api/utils/trpc/client';

export type CollectiviteOutput =
  RouterOutput['collectivites']['collectivites']['select'];

export const useSelectCollectivite = (collectiviteId: number) =>
  trpc.collectivites.collectivites.select.useQuery({collectiviteId});
