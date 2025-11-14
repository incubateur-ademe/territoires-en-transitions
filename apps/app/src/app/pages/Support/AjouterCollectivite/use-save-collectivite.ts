import { useTRPC } from '@/api';
import { useMutation } from '@tanstack/react-query';

export const useSaveCollectivite = () => {
  const trpc = useTRPC();

  return useMutation(trpc.collectivites.collectivites.upsert.mutationOptions());
};
