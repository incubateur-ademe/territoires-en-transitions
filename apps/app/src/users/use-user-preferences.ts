import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useUserPreferences = () => {
  const trpc = useTRPC();
  return useQuery(trpc.users.preferences.get.queryOptions());
};

export const useUpdateUserPreferences = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.users.preferences.updateFlat.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.users.preferences.get.queryKey(),
        });
      },
    })
  );
};
