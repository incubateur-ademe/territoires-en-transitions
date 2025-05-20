import { trpc } from '@/api/utils/trpc/client';
import { useRouter } from 'next/navigation';

export const useUpdateUser = () => {
  const router = useRouter();
  return trpc.utilisateurs.update.useMutation({
    onSuccess: () => {
      router.refresh();
    },
  });
};
