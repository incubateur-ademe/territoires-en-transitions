import { supabaseClient } from '@/app/core-logic/api/supabase';
import { useFonctionTracker } from '@/app/core-logic/hooks/useFonctionTracker';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { format as formatDate } from 'date-fns';
import { useMutation } from 'react-query';

export const useExportFicheAction = (ficheId: number | null) => {
  const tracker = useFonctionTracker();

  return useMutation(
    ['export_fiche_action', ficheId],
    async (format: 'xlsx' | 'docx') => {
      if (!ficheId) return;
      const titre = await fetchFicheActionTitle(ficheId);
      const { data } = await supabaseClient.functions.invoke(
        'export_plan_action',
        {
          body: { ficheId, format },
        }
      );

      if (data) {
        // on génère le nom du fichier car l'en-tête "content-disposition" de la
        // fonction edge ne semble pas être transmis correctement au client...
        const exportedAt = formatDate(new Date(), 'yyyy-MM-dd');
        const filename = `Export_${titre}_${exportedAt}.${format}`;
        saveBlob(data, filename);

        tracker({
          page: 'fiche',
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

const fetchFicheActionTitle = async (ficheId: number) => {
  const query = supabaseClient
    .from('fiche_action')
    .select('titre')
    .eq('id', ficheId);

  const { error, data } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data?.[0]?.titre;
};
