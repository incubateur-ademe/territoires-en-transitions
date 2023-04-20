import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {
  TFichier,
  TPreuveLienFields,
} from 'ui/shared/preuves/Bibliotheque/types';

/** Renvoi les annexes associées aux fiches d'un plan d'action */
export const useAnnexesPlanAction = (plan_id: number) =>
  useQuery(['annexes_plan_action', plan_id], () =>
    fetchAnnexesPlanAction(plan_id)
  );
const fetchAnnexesPlanAction = async (plan_id: number) => {
  // charge la liste des annexes associées aux fiches d'un plan d'action
  const {data, error} = await supabaseClient
    .from('bibliotheque_annexe')
    .select()
    .overlaps('plan_ids', [plan_id])
    .order('lien->>titre' as 'lien', {ascending: true})
    .order('fichier->>filename' as 'fichier', {ascending: true});
  if (error) {
    throw new Error(error.message);
  }

  return data.map(a => ({
    ...a,
    preuve_type: 'annexe',
    fichier: a.fichier as TFichier | null,
    lien: a.lien as TPreuveLienFields['lien'] | null,
  }));
};
