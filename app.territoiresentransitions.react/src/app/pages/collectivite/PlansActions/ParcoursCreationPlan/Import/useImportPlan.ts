import { useState } from 'react';
import { trpc } from '@/api/utils/trpc/client';

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

export const useImportPlan = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { mutate } = trpc.plans.fiches.import.useMutation({
    onSuccess: () => {
      setSuccessMessage('Import réussie ! Le plan apparaîtra après avoir actualisé la page.');
      setErrorMessage(null);
      setIsLoading(false);
    },
    onError: (error) => {
      setErrorMessage(`${error.message}`);
      setSuccessMessage(null);
      setIsLoading(false);
    },
  });

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
        'collectiviteId': collectiviteId,
        'planName': planName,
        'planType': planType,
        'file': base64File,
      };

      mutate(input);
    }catch (error){
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
