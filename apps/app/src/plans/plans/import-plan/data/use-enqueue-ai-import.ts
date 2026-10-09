import { useApiClient } from '@/app/utils/use-api-client';
import { useTRPC } from '@tet/api';
import {
  useMutation,
  useQueryClient,
  UseMutationResult,
} from '@tanstack/react-query';
import { z } from 'zod';

export type AiImportEnqueueInput = {
  collectiviteId: number;
  file: File;
  planName: string;
  planType?: number;
  instructions?: string;
  withVerifications: boolean;
  withSousActions: boolean;
  /** Relance assumée de l'import d'un fichier déjà importé. */
  confirmReimport?: boolean;
};

const enqueueResponseSchema = z.object({
  jobId: z.string(),
  planId: z.number(),
});
export type AiImportEnqueueResult = z.infer<typeof enqueueResponseSchema>;

const makeEnqueueImportRoute = (collectiviteId: number): string =>
  `/collectivites/${collectiviteId}/plans/import-ia`;

export const useEnqueueAiImport = (): UseMutationResult<
  AiImportEnqueueResult,
  Error,
  AiImportEnqueueInput
> => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation({
    mutationFn: async (input: AiImportEnqueueInput) => {
      const formData = new FormData();
      formData.append('file', input.file);
      formData.append('planName', input.planName);
      if (input.planType !== undefined) {
        formData.append('planType', String(input.planType));
      }
      if (input.instructions) {
        formData.append('instructions', input.instructions);
      }
      formData.append('withVerifications', String(input.withVerifications));
      formData.append('withSousActions', String(input.withSousActions));
      if (input.confirmReimport) {
        formData.append('confirmReimport', 'true');
      }

      const response = await apiClient.postFormData({
        route: makeEnqueueImportRoute(input.collectiviteId),
        formData,
      });
      return enqueueResponseSchema.parse(response);
    },
    onSuccess: (_result, { collectiviteId }) => {
      // Le plan existe dès le lancement, en cours d'import.
      for (const queryKey of [
        trpc.plans.aiImport.getCurrentAiImport.queryKey({ collectiviteId }),
        trpc.plans.aiImport.findPreviousAiImport.queryKey(),
        trpc.plans.plans.list.queryKey({ collectiviteId }),
      ]) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });
};
