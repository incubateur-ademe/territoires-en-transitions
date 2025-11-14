import { useTRPC } from '@/api';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export const useUpdateUser = () => {
  const router = useRouter();
  const trpc = useTRPC();

  return useMutation(
    trpc.users.update.mutationOptions({
      onSuccess: () => {
        router.refresh();
      },
    })
  );
};
