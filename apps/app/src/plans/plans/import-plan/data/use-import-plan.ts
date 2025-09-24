import { useTRPC } from '@/api/utils/trpc/client';
import { convertFileToBase64 } from '@/app/utils/convert-file-to-base64';
import {
  UpdatePlanPilotesSchema,
  UpdatePlanReferentsSchema,
} from '@/domain/plans/plans';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export const useImportPlan = () => {
  const queryClient = useQueryClient();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const trpc = useTRPC();
  const { mutateAsync, isPending } = useMutation(
    trpc.plans.fiches.import.mutationOptions({
      onSuccess: () => {
        setErrorMessage(null);
        queryClient.invalidateQueries({
          queryKey: trpc.plans.plans.list.queryKey({}),
        });
      },
      onError: (error) => {
        setErrorMessage(`${error.message}`);
      },
    })
  );

  const importPlan = async (planToImport: {
    file: File;
    collectiviteId: number;
    planName: string;
    planType?: number;
    pilotes?: UpdatePlanPilotesSchema[];
    referents?: UpdatePlanReferentsSchema[];
  }) => {
    try {
      const base64File = await convertFileToBase64(planToImport.file);

      await mutateAsync({
        ...planToImport,
        file: base64File,
      });
      return { success: true };
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `Erreur lors de l'envoi du fichier.`
      );
      return { success: false };
    }
  };

  return {
    mutate: importPlan,
    isLoading: isPending,
    errorMessage,
  };
};
