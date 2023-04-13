import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {TPreuve} from 'ui/shared/preuves/Bibliotheque/types';

/** Renvoi les annexes associées à une fiche */
export const useAnnexesFicheAction = (fiche_id: number | null) =>
  useQuery(['annexes_fiche_action', fiche_id], () =>
    fetchAnnexesFicheAction(fiche_id)
  );

const fetchAnnexesFicheAction = async (fiche_id: number | null) => {
  if (!fiche_id) {
    return [];
  }

  // charge la liste des annexes associées à la fiche
  const {data, error} = await supabaseClient
    .from('bibliotheque_annexe')
    .select()
    .eq('fiche_id', fiche_id)
    .order('lien->>titre' as 'lien', {ascending: true})
    .order('fichier->>filename' as 'fichier', {ascending: true});
  if (error) {
    throw new Error(error.message);
  }

  return data.map(a => ({...a, preuve_type: 'annexe'})) as unknown as TPreuve[];
};
