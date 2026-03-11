import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useRouter } from 'next/navigation';

export const useReferentielsResetDisplayPreferences = () => {
  const trpc = useTRPC();
  const router = useRouter();

  return useMutation(
    trpc.referentiels.preferences.resetCollectiviteDisplayPreferences.mutationOptions(
      {
        onSuccess: () => {
          // TODO: find a more optimized way to update the user context
          router.refresh();
        },
      }
    )
  );
};
