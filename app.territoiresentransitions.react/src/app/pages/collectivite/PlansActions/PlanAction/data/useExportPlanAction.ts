import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useFonctionTracker } from '@/app/core-logic/hooks/useFonctionTracker';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { format as formatDate } from 'date-fns';
import { useMutation } from 'react-query';

export const useExportPlanAction = (planId: number) => {
  const tracker = useFonctionTracker();
  const supabase = useSupabase();

  return useMutation(
    ['export_plan_action', planId],
    async (format: 'xlsx' | 'docx') => {
      const titre = await fetchPlansActionsTitle(supabase, planId);
      const { data } = await supabase.functions.invoke('export_plan_action', {
        body: { planId, format },
      });

      if (data) {
        // on génère le nom du fichier car l'en-tête "content-disposition" de la
        // fonction edge ne semble pas être transmis correctement au client...
        const exportedAt = formatDate(new Date(), 'yyyy-MM-dd');
        const filename = `Export_${titre}_${exportedAt}.${format}`;
        saveBlob(data, filename);

        tracker({
          page: 'plan',
          action: 'telechargement',
          fonction: `export_${format}`,
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

const fetchPlansActionsTitle = async (supabase: DBClient, planId: number) => {
  const query = supabase
    .from('axe')
    .select('nom')
    .eq('id', planId)
    .is('parent', null);

  const { error, data } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data?.[0]?.nom;
};
