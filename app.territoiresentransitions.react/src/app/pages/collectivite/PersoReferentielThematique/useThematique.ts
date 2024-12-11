import { Tables } from '@/api';
import { supabaseClient } from 'core-logic/api/supabase';
import { useQuery } from 'react-query';

export type TQuestionThematiqueRead = Tables<'question_thematique'>;

type TUseThematique = (
  thematique_id: string | undefined
) => TQuestionThematiqueRead | null;

// charge les informations d'une thématique
export const useThematique: TUseThematique = (thematique_id) => {
  const { data } = useQuery(['question_thematique', thematique_id], () =>
    fetch(thematique_id)
  );
  return data || null;
};

// charge les données de la thématique
const fetch = async (thematique_id: string | undefined) => {
  if (thematique_id) {
    const { data: thematique } = await supabaseClient
      .from('question_thematique')
      .select()
      .eq('id', thematique_id);
    return (thematique?.[0] as TQuestionThematiqueRead) || null;
  }
  return null;
};
