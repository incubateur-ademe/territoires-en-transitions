import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteContext, useCurrentCollectivite } from '@tet/api/collectivites';
import { useRouter } from 'next/navigation';

export const useUpdateCollectivitePreferences = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const currentCollectivite = useCurrentCollectivite();
  const { setCollectivite } = useCollectiviteContext();

  return useMutation(
    trpc.collectivites.preferences.update.mutationOptions({
      onSuccess: (collectivitePreferences) => {
        setCollectivite({
          ...currentCollectivite,
          collectivitePreferences,
        });
        router.refresh();
      },
    })
  );
};
