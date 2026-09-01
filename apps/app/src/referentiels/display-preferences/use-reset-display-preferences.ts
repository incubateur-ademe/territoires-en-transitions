import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  useCollectiviteContext,
  useCurrentCollectivite,
} from '@tet/api/collectivites';
import { useRouter } from 'next/navigation';

export const useReferentielsResetDisplayPreferences = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const currentCollectivite = useCurrentCollectivite();
  const { setCollectivite } = useCollectiviteContext();

  return useMutation(
    trpc.referentiels.preferences.resetCollectiviteDisplayPreferences.mutationOptions(
      {
        onSuccess: (collectivitePreferences) => {
          setCollectivite({
            ...currentCollectivite,
            collectivitePreferences,
          });
          router.refresh();
        },
      }
    )
  );
};
