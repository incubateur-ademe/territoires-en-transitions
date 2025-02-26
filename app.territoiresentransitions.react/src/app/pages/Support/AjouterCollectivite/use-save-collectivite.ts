import { trpc } from '@/api/utils/trpc/client';

export const useSaveCollectivite = () => {
  return trpc.collectivites.collectivites.upsert.useMutation();
};
