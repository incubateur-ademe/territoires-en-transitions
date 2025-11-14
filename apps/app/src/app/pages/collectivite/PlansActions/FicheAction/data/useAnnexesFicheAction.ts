import { DBClient } from '@/api';
import { useSupabase } from '@/api';
import { TPreuve } from '@/app/referentiels/preuves/Bibliotheque/types';
import { useQuery } from '@tanstack/react-query';

/** Renvoi les annexes associées à une fiche */
export const useAnnexesFicheAction = (
  collectiviteId: number,
  ficheId: number | null
) => {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['annexes_fiche_action', collectiviteId, ficheId],

    queryFn: () => fetchAnnexesFicheAction(supabase, collectiviteId, ficheId),
  });
};

const fetchAnnexesFicheAction = async (
  supabase: DBClient,
  collectiviteId: number,
  ficheId: number | null
) => {
  if (!ficheId) {
    return [];
  }

  // charge la liste des annexes associées à la fiche
  const { data, error } = await supabase
    .from('bibliotheque_annexe')
    .select()
    .match({ collectivite_id: collectiviteId, fiche_id: ficheId })
    .order('lien->>titre' as 'lien', { ascending: true })
    .order('fichier->>filename' as 'fichier', { ascending: true });
  if (error) {
    throw new Error(error.message);
  }

  return data.map((a) => ({
    ...a,
    preuve_type: 'annexe',
  })) as unknown as TPreuve[];
};
