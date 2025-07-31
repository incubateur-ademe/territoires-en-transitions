import { useTRPC } from '@/api/utils/trpc/client';
import { convertFileToBase64 } from '@/app/utils/convert-file-to-base64';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

export const useImportPlan = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const trpc = useTRPC();
  const { mutate } = useMutation(
    trpc.plans.fiches.import.mutationOptions({
      onSuccess: () => {
        setSuccessMessage(
          'Import réussi ! Le plan apparaîtra après avoir actualisé la page.'
        );
        setErrorMessage(null);
        setIsLoading(false);
      },
      onError: (error) => {
        setErrorMessage(`${error.message}`);
        setSuccessMessage(null);
        setIsLoading(false);
      },
    })
  );

  const importPlan = async (
    file: File,
    collectiviteId: number,
    planName: string,
    planType?: number
  ) => {
    try {
      setIsLoading(true);
      const base64File = await convertFileToBase64(file);
      const input = {
        collectiviteId: collectiviteId,
        planName: planName,
        planType: planType,
        file: base64File,
      };

      mutate(input);
    } catch (error) {
      setErrorMessage(`Erreur lors de l'envoi du fichier.`);
      setIsLoading(false);
    }
  };

  return {
    mutate: importPlan,
    isLoading,
    successMessage,
    setSuccessMessage,
    errorMessage,
    setErrorMessage,
  };
};
