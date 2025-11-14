import { useTRPC } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export const useDeleteAxe = (
  axe_id: number,
  planId: number,
  redirectURL?: string
) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const trpc = useTRPC();
  const { mutateAsync: deleteAxe } = useMutation(
    trpc.plans.plans.deleteAxe.mutationOptions()
  );

  return useMutation({
    mutationFn: async () => {
      await deleteAxe({ axeId: axe_id });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: trpc.plans.plans.get.queryKey({ planId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.plans.plans.get.queryKey({ planId }),
      });
      redirectURL && router.push(redirectURL);
    },
  });
};
