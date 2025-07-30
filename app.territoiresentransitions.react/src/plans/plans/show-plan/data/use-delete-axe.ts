import { trpc, useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export const useDeleteAxe = (
  axe_id: number,
  planId: number,
  redirectURL?: string
) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const trpcClient = useTRPC();
  const { mutateAsync: deleteAxe } = trpc.plans.plans.deleteAxe.useMutation();

  return useMutation({
    mutationFn: async () => {
      await deleteAxe({ axeId: axe_id });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: trpcClient.plans.plans.get.queryKey({ planId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpcClient.plans.plans.get.queryKey({ planId }),
      });
      redirectURL && router.push(redirectURL);
    },
  });
};
