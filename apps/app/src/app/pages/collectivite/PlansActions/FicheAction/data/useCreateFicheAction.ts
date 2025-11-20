'use client';
import { makeCollectiviteFicheNonClasseeUrl } from '@/app/app/paths';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useRouter } from 'next/navigation';

export const useCreateFicheAction = () => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const router = useRouter();
  const trpcClient = useTRPC();

  const { mutateAsync: createFiche } = useMutation(
    trpcClient.plans.fiches.create.mutationOptions()
  );

  return useMutation({
    mutationFn: () => createFiche({ fiche: { collectiviteId } }),
    meta: { disableToast: true },

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['axe_fiches', null],
      });
      if (data.id) {
        const url = makeCollectiviteFicheNonClasseeUrl({
          collectiviteId,
          ficheUid: data.id.toString(),
        });
        router.push(url);
      }
    },
  });
};
