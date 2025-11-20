import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { useApiClient } from '@/app/utils/use-api-client';
import { DOWNLOAD_FILE_MUTATION_OPTIONS } from '@/app/utils/useDownloadFile';
import { useMutation } from '@tanstack/react-query';
import { ChartRenderRequestType } from '@tet/domain/utils';

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
