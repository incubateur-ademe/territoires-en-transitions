import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { DOWNLOAD_FILE_MUTATION_OPTIONS } from '@/app/utils/useDownloadFile';
import { ChartRenderRequestType } from '@/domain/utils';
import { useMutation } from '@tanstack/react-query';

/** Télécharge le fichier xlsx modèle */
export const useChartDownloader = () => {
  const api = useApiClient();

  return useMutation({
    mutationKey: ['charts/render'],

    mutationFn: async (params: ChartRenderRequestType) => {
      const { blob, filename } = await api.getAsBlob(
        {
          route: '/charts/render',
          params,
        },
        'POST'
      );
      if (blob) {
        await saveBlob(blob, filename || `chart.${params.format}`);
      }
    },
    ...DOWNLOAD_FILE_MUTATION_OPTIONS,
  });
};
