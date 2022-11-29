import {useQueries, useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {QuestionType, TQuestionRead} from 'generated/dataLayer/question_read';
import {TReponseRead, TReponse} from 'generated/dataLayer/reponse_read';

type TFilters = {
  action_ids?: string[];
  thematique_id?: string;
};

/**
 * Charge la liste des questions de personnalisation et leur éventuelle réponse
 * pour la collectivité courante. La liste est filtrable par action(s) ou par
 * thématique
 */
export const useQuestionsReponses = (filters: TFilters) => {
  // charge les questions et les réponses
  const {data: questions} = useQuestions(filters);
  const reponses = useReponses(questions!);

  // indexe les réponses par id de question
  const reponsesByQuestionId = new Map<string, TReponse>();
  reponses.forEach(({data}) => {
    if (data) {
      const {question_id, reponse} = data;
      reponsesByQuestionId.set(question_id, reponse.reponse);
    }
  });

  // associe les réponses aux questions
  const qrList = questions?.map(question => {
    const reponse = reponsesByQuestionId.get(question.id);
    return {...question, reponse};
  });

  return qrList || [];
};

// charge les questions
const useQuestions = (filters: TFilters) => {
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

// charge les réponses correspondant aux questions données
const useReponses = (questions: TQuestionRead[]) => {
  const collectivite_id = useCollectiviteId();

  // une requête par question pour permettre le rechargement individuel
  const queries = questions.map(q => ({
    queryKey: ['reponse', collectivite_id, q.id],
    queryFn: () => fetchReponse(collectivite_id!, q.id),
    enabled: !!collectivite_id,
  }));

  return useQueries(queries);
};
const fetchReponse = async (collectivite_id: number, question_id: string) => {
  const query = supabaseClient
    .from('reponse_display')
    .select()
    .match({collectivite_id, question_id});

  // attends les données
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data?.length ? transform(data[0] as TReponseRead) : undefined;
};

// met à jour si nécessaire la valeur d'une réponse lue depuis la base
const transform = (row: TReponseRead) => {
  const {reponse} = row;
  const {type, reponse: reponseValue} = reponse;

  // transforme en pourcentage une réponse de type proportion
  if (type === QuestionType.proportion) {
    const value =
      typeof reponseValue === 'number' ? (reponseValue * 100).toFixed(0) : '';
    return setReponseValue(row, value);
  }

  // transforme une valeur booléen en id (oui/non) du bouton radio correspondant
  if (reponseValue !== null && type === QuestionType.binaire) {
    if (reponseValue === true) return setReponseValue(row, 'oui');
    if (reponseValue === false) return setReponseValue(row, 'non');
    return setReponseValue(row, null);
  }

  // autres cas: renvoi la réponse inchangée
  return row;
};

// change la valeur dans une réponse et renvoi l'objet résultant
const setReponseValue = (row: TReponseRead, reponseValue: TReponse) => {
  const {reponse} = row;

  return {
    ...row,
    reponse: {
      ...reponse,
      reponse: reponseValue,
    },
  };
};
