import {useMutation} from 'react-query';
import {format as formatDate} from 'date-fns';
import {supabaseClient} from 'core-logic/api/supabase';
import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {saveBlob} from 'ui/shared/preuves/Bibliotheque/saveBlob';

export const useExportScore = (
  referentiel: string | null,
  collectivite: CurrentCollectivite | null
) => {
  const tracker = useFonctionTracker();
  const collectivite_id = collectivite?.collectivite_id;

  return useMutation(
    ['export_score', collectivite_id, referentiel],
    async () => {
      if (!collectivite_id) return;
      const {data} = await supabaseClient.functions.invoke('export_score', {
        body: {collectivite_id, referentiel},
      });

      if (data) {
        // on génère le nom du fichier car l'en-tête "content-disposition" de la
        // fonction edge ne semble pas être transmis correctement au client...
        const exportedAt = formatDate(new Date(), 'yyyy-MM-dd');
        // Export_ECI_Ambérieu-en-Bugey_2023-09-20
        const filename = `Export_${referentiel?.toUpperCase()}_${
          collectivite.nom
        }_${exportedAt}.xlsx`;
        saveBlob(data, filename);

        tracker({
          page: 'referentiel',
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
