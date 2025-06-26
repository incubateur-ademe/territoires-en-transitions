import { DBClient } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { TQuestionRead } from '@/app/referentiels/personnalisations/personnalisation.types';
import { useQuery } from '@tanstack/react-query';

export type TFilters = {
  action_ids?: string[];
  thematique_id?: string;
  questionIds?: string[];
};

/**
 * Charge la liste des questions de personnalisation pour la collectivité
 * courante. La liste est filtrable par action(s) ou par thématique.
 */
export const useQuestions = (filters: TFilters) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['questions', collectiviteId, filters],
    queryFn: () => fetchQuestions(supabase, collectiviteId, filters),
    initialData: [],
  });
};
const fetchQuestions = async (
  supabase: DBClient,
  collectiviteId: number,
  filters: TFilters
) => {
  const query = supabase
    .from('question_display')
    .select()
    .eq('collectivite_id', collectiviteId);

  const { action_ids, thematique_id, questionIds } = filters || {};
  if (action_ids) {
    query.contains('action_ids', action_ids);
  }

  if (thematique_id) {
    query.eq('thematique_id', thematique_id);
  }

  if (questionIds) {
    query.in('id', questionIds);
  }

  query.order('ordonnancement', { ascending: true });

  // attends les données
  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as TQuestionRead[];
};
