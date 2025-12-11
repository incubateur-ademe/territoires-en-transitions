import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@tet/api';

export type AnnexeInfo = {
  id: number | null;
  created_at: string | null;
  created_by_nom: string | null;
  commentaire: string | null;
  filename: string | null;
  titre: string | null;
  url: string | null;
};

export const useAnnexesFicheActionInfos = (
  fiche_id: number | null,
  requested = true
) => {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['annexes_fiche_action_infos', fiche_id],

    queryFn: async () => {
      if (!fiche_id) return [];

      const { data, error } = await supabase
        .from('bibliotheque_annexe')
        .select(
          'id, created_at, created_by_nom, commentaire, fichier->>filename, lien->>titre, lien->>url'
        )
        .eq('fiche_id', fiche_id)
        .order('lien->>titre' as 'lien', { ascending: true })
        .order('fichier->>filename' as 'fichier', { ascending: true });

      if (error) throw new Error(error.message);

      return data as unknown as AnnexeInfo[];
    },

    enabled: requested,
  });
};
