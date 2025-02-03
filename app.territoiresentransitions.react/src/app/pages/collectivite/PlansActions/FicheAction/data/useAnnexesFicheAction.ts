import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { TPreuve } from '@/app/referentiels/preuves/Bibliotheque/types';
import { useQuery } from 'react-query';

/** Renvoi les annexes associées à une fiche */
export const useAnnexesFicheAction = (
  collectiviteId: number,
  ficheId: number | null
) =>
  useQuery(['annexes_fiche_action', collectiviteId, ficheId], () =>
    fetchAnnexesFicheAction(collectiviteId, ficheId)
  );

const fetchAnnexesFicheAction = async (
  collectiviteId: number,
  ficheId: number | null
) => {
  if (!ficheId) {
    return [];
  }

  // charge la liste des annexes associées à la fiche
  const { data, error } = await supabaseClient
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
