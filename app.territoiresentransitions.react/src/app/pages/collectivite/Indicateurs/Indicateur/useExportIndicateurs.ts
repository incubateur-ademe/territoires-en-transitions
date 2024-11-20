import { useMutation } from 'react-query';
import { useFonctionTracker } from 'core-logic/hooks/useFonctionTracker';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useApiClient } from 'core-logic/api/useApiClient';
import { saveBlob } from 'ui/shared/preuves/Bibliotheque/saveBlob';
import { TIndicateurListItem } from '../types';

export const useExportIndicateurs = (definitions?: TIndicateurListItem[]) => {
  const tracker = useFonctionTracker();
  const collectiviteId = useCollectiviteId();
  const apiClient = useApiClient();

  return useMutation(
    ['export_indicateurs', collectiviteId],
    async () => {
      if (!collectiviteId || !definitions?.length) return;
      const indicateurIds = definitions.map((d) => d.id);
      const { blob, filename } = await apiClient.getAsBlob(
        {
          route: '/indicateurs/xlsx',
          params: { collectiviteId, indicateurIds },
        },
        'POST'
      );

      if (filename && blob) {
        saveBlob(blob, filename);

        tracker({
          page: 'indicateur',
          action: 'telechargement',
          fonction: 'export_xlsx',
        });
      }
    },
    {
      meta: {
        success: 'Export terminé',
        error: "Échec de l'export",
      },
    }
  );
};
