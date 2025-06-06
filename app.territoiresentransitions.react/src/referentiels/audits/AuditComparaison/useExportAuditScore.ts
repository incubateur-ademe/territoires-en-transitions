import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { CurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { Event, useEventTracker } from '@/ui';
import { format as formatDate } from 'date-fns';
import { useMutation } from 'react-query';

export const useExportAuditScores = (
  referentiel: string | null,
  collectivite: CurrentCollectivite | null
) => {
  const tracker = useEventTracker();
  const supabase = useSupabase();

  const collectivite_id = collectivite?.collectiviteId;

  return useMutation(
    ['export_audit_score', collectivite_id, referentiel],
    async () => {
      if (!collectivite_id) return;
      const { data } = await supabase.functions.invoke('export_audit_score', {
        body: { collectivite_id, referentiel },
      });

      if (data) {
        // on génère le nom du fichier car l'en-tête "content-disposition" de la
        // fonction edge ne semble pas être transmis correctement au client...
        const exportedAt = formatDate(new Date(), 'yyyy-MM-dd');
        // Export_audit_CC Elan Limousin Avenir Nature_2023-09-08
        const filename = `Export_audit_${collectivite.nom}_${exportedAt}.xlsx`;
        saveBlob(data, filename);

        tracker(Event.referentiels.exportAuditScore);
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
