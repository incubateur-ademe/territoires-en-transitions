import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { CurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { Event, useEventTracker } from '@/ui';
import { useMutation } from 'react-query';

export const useExportAuditScores = (
  referentiel: string | null,
  collectivite: CurrentCollectivite | null
) => {
  const tracker = useEventTracker();
  const api = useApiClient();

  const collectivite_id = collectivite?.collectiviteId;

  return useMutation(
    async () => {
      if (!collectivite_id || !referentiel) return;

      tracker(Event.referentiels.exportAuditScore);

      const currentYear = new Date().getFullYear();
      const { blob, filename } = await api.getAsBlob({
        route: `/collectivites/${collectivite_id}/referentiels/${referentiel}/audit/${currentYear}/export`,
      });

      await saveBlob(blob, filename as string);

      // if (response.data) {
      //   // on génère le nom du fichier car l'en-tête "content-disposition" de la
      //   // fonction edge ne semble pas être transmis correctement au client...
      //   const exportedAt = formatDate(new Date(), 'yyyy-MM-dd');
      //   // Export_audit_CC Elan Limousin Avenir Nature_2023-09-08
      //   const filename = `Export_audit_${collectivite.nom}_${exportedAt}.xlsx`;
      //   saveBlob(response.data, filename);
    },
    {
      meta: {
        success: 'Export terminé',
        error: "Échec de l'export",
      },
    }
  );
};
