import { supabaseClient } from '@/app/core-logic/api/supabase';
import { CurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { useFonctionTracker } from '@/app/core-logic/hooks/useFonctionTracker';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { format as formatDate } from 'date-fns';
import { useMutation } from 'react-query';

export const useExportAuditScores = (
  referentiel: string | null,
  collectivite: CurrentCollectivite | null
) => {
  const tracker = useFonctionTracker();
  const collectivite_id = collectivite?.collectiviteId;

  return useMutation(
    ['export_audit_score', collectivite_id, referentiel],
    async () => {
      if (!collectivite_id) return;
      const { data } = await supabaseClient.functions.invoke(
        'export_audit_score',
        {
          body: { collectivite_id, referentiel },
        }
      );

      if (data) {
        // on génère le nom du fichier car l'en-tête "content-disposition" de la
        // fonction edge ne semble pas être transmis correctement au client...
        const exportedAt = formatDate(new Date(), 'yyyy-MM-dd');
        // Export_audit_CC Elan Limousin Avenir Nature_2023-09-08
        const filename = `Export_audit_${collectivite.nom}_${exportedAt}.xlsx`;
        saveBlob(data, filename);

        tracker({
          page: 'labellisation',
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
