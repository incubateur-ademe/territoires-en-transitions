import { Tables } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from 'react-query';

export type TQuestionThematiqueRead = Tables<'question_thematique'>;

type TUseThematique = (
  thematique_id: string | undefined
) => TQuestionThematiqueRead | null;

// charge les informations d'une thématique
export const useThematique: TUseThematique = (thematique_id) => {
  const supabase = useSupabase();
  const { data } = useQuery(
    ['question_thematique', thematique_id],
    async () => {
      if (thematique_id) {
        const { data: thematique } = await supabase
          .from('question_thematique')
          .select()
          .eq('id', thematique_id);
        return (thematique?.[0] as TQuestionThematiqueRead) || null;
      }
      return null;
    }
  );

  return data || null;
};
