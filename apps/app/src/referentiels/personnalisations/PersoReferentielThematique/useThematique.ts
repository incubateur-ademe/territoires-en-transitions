import { useQuery } from '@tanstack/react-query';
import { Tables, useSupabase } from '@tet/api';

export type TQuestionThematiqueRead = Tables<'question_thematique'>;

type TUseThematique = (
  thematique_id: string | undefined
) => TQuestionThematiqueRead | null;

// charge les informations d'une thématique
export const useThematique: TUseThematique = (thematique_id) => {
  const supabase = useSupabase();
  const { data } = useQuery({
    queryKey: ['question_thematique', thematique_id],

    queryFn: async () => {
      if (thematique_id) {
        const { data: thematique } = await supabase
          .from('question_thematique')
          .select()
          .eq('id', thematique_id);
        return (thematique?.[0] as TQuestionThematiqueRead) || null;
      }
      return null;
    },
  });

  return data || null;
};
