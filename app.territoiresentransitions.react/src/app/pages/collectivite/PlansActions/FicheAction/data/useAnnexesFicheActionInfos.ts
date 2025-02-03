import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useQuery } from 'react-query';

export type AnnexeInfo = {
  id: number | null;
  created_at: string | null;
  created_by_nom: string | null;
  commentaire: string | null;
  filename: string | null;
  titre: string | null;
  url: string | null;
};

export const useAnnexesFicheActionInfos = (fiche_id: number | null) => {
  return useQuery(['annexes_fiche_action_infos', fiche_id], async () => {
    if (!fiche_id) return [];

    const { data, error } = await supabaseClient
      .from('bibliotheque_annexe')
      .select(
        'id, created_at, created_by_nom, commentaire, fichier->>filename, lien->>titre, lien->>url'
      )
      .eq('fiche_id', fiche_id)
      .order('lien->>titre' as 'lien', { ascending: true })
      .order('fichier->>filename' as 'fichier', { ascending: true });

    if (error) throw new Error(error.message);

    return data as unknown as AnnexeInfo[];
  });
};
