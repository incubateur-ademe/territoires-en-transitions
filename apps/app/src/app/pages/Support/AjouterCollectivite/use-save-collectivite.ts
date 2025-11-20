import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useSaveCollectivite = () => {
  const trpc = useTRPC();

  return useMutation(trpc.collectivites.collectivites.upsert.mutationOptions());
};
