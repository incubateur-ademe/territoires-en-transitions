import { convertFileToBase64 } from '@/app/utils/convert-file-to-base64';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { PersonneId } from '@tet/domain/collectivites';
import { Event, useEventTracker } from '@tet/ui';
import { useState } from 'react';

type ImportPlanInput = {
  file: File;
  collectiviteId: number;
  planName: string;
  planType?: number;
  pilotes?: PersonneId[];
  referents?: PersonneId[];
};

export type ImportPlanResult =
  | { success: true; data: { planId: number; fichesCount: number } }
  | { success: false; errorMessage: string };

const FALLBACK_ERROR_MESSAGE = `Erreur lors de l'envoi du fichier.`;

export const useImportPlan = () => {
  const queryClient = useQueryClient();
  const trackEvent = useEventTracker();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const trpc = useTRPC();
  const { mutateAsync, isPending } = useMutation(
    trpc.plans.plans.import.mutationOptions({
      onSuccess: () => {
        setErrorMessage(null);
        queryClient.invalidateQueries({
          queryKey: trpc.plans.plans.list.queryKey({}),
        });
      },
      onError: (error) => {
        setErrorMessage(error.message);
      },
    })
  );

  const importPlan = async (
    planToImport: ImportPlanInput
  ): Promise<ImportPlanResult> => {
    const fichierType =
      planToImport.file.name.split('.').pop()?.toLowerCase() ?? '';
    const fichierTailleKo = Math.round(planToImport.file.size / 1024);

    trackEvent(Event.plans.import.lancer, {
      fichierType,
      fichierTailleKo,
    });

    const startedAt = Date.now();
    try {
      const base64File = await convertFileToBase64(planToImport.file);

      const data = await mutateAsync({
        ...planToImport,
        file: base64File,
      });
      trackEvent(Event.plans.import.resultat, {
        succes: true,
        erreurType: null,
        dureeMs: Date.now() - startedAt,
        fichesCount: data.fichesCount,
      });
      return { success: true, data };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : FALLBACK_ERROR_MESSAGE;
      setErrorMessage(message);
      trackEvent(Event.plans.import.resultat, {
        succes: false,
        erreurType: message,
        dureeMs: Date.now() - startedAt,
        fichesCount: null,
      });
      return { success: false, errorMessage: message };
    }
  };

  return {
    mutate: importPlan,
    isLoading: isPending,
    errorMessage,
    clearError: () => setErrorMessage(null),
  };
};
