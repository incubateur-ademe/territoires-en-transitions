import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
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
