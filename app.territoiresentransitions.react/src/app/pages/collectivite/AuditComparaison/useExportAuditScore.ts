import {useMutation} from 'react-query';
import {format as formatDate} from 'date-fns';
import {supabaseClient} from 'core-logic/api/supabase';
import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {saveBlob} from 'ui/shared/preuves/Bibliotheque/saveBlob';

export const useExportAuditScores = (
  referentiel: string | null,
  collectivite: CurrentCollectivite | null
) => {
  const tracker = useFonctionTracker();
  const collectivite_id = collectivite?.collectivite_id;

  return useMutation(
    ['export_audit_score', collectivite_id, referentiel],
    async () => {
      if (!collectivite_id) return;
      const {data} = await supabaseClient.functions.invoke(
        'export_audit_score',
        {
          body: {collectivite_id, referentiel},
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
