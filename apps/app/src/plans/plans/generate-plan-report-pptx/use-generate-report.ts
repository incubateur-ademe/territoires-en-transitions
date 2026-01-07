import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useGenerateReport = () => {
  const trpc = useTRPC();

  return useMutation(
    trpc.plans.reports.create.mutationOptions({
      meta: {
        disableToast: true,
      },
    })
  );
};
