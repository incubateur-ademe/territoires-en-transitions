import { trpc } from '@/api/utils/trpc/client';

export const useUpdateUser = () => {
  const trpcUtils = trpc.useUtils();

  return trpc.utilisateurs.update.useMutation({
    onSuccess: () => {
      trpcUtils.utilisateurs.get.invalidate();
    },
  });
};
