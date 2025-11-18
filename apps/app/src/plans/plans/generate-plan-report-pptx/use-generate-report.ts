import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { convertFileToBase64 } from '@/app/utils/convert-file-to-base64';
import { useApiClient } from '@/app/utils/use-api-client';
import { useMutation } from '@tanstack/react-query';
import { GenerateReportFormArgs } from './generate-report.form';

export const useGenerateReport = () => {
  const apiClient = useApiClient();

  return useMutation({
    mutationKey: ['generate_report'],

    mutationFn: async (request: GenerateReportFormArgs) => {
      // Convert File to base64 if provided
      const logoFileBase64 = request.logoFile
        ? await convertFileToBase64(request.logoFile)
        : undefined;

      // Prepare the request payload (excluding the File object)
      const { logoFile, ...requestPayload } = request;
      const payload = {
        ...requestPayload,
        ...(logoFileBase64 ? { logoFile: logoFileBase64 } : {}),
      };

      const { blob, filename } = await apiClient.getAsBlob(
        {
          route: '/reports/generate',
          params: payload,
        },
        'POST'
      );

      if (filename && blob) {
        saveBlob(blob, filename);
      }
    },

    meta: {
      disableToast: true,
    },
  });
};
