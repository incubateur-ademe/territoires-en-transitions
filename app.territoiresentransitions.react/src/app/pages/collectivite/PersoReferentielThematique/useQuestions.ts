import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TQuestionRead} from 'types/personnalisation';

export type TFilters = {
  action_ids?: string[];
  thematique_id?: string;
};

/**
 * Charge la liste des questions de personnalisation pour la collectivité
 * courante. La liste est filtrable par action(s) ou par thématique.
 */
export const useQuestions = (filters: TFilters) => {
  const collectivite_id = useCollectiviteId();

  return useQuery(
    ['questions', collectivite_id, filters],
    () => fetchQuestions(collectivite_id!, filters),
    {enabled: !!collectivite_id, initialData: []}
  );
};
const fetchQuestions = async (collectivite_id: number, filters: TFilters) => {
  const query = supabaseClient
    .from('question_display')
    .select()
    .eq('collectivite_id', collectivite_id);

  const {action_ids, thematique_id} = filters || {};
  if (action_ids) {
    query.contains('action_ids', action_ids);
  }

  if (thematique_id) {
    query.eq('thematique_id', thematique_id);
  }

  // attends les données
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as TQuestionRead[];
};
