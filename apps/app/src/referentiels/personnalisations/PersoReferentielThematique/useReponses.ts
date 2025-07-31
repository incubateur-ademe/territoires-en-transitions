import { DBClient } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import {
  TQuestionRead,
  TReponse,
  TReponseRead,
} from '@/app/referentiels/personnalisations/personnalisation.types';
import { roundTo } from '@/domain/utils';
import { useQueries } from '@tanstack/react-query';

// charge les réponses existantes pour une série de questions donnée
export const useReponses = (questions: TQuestionRead[]) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  // une requête par question pour permettre le rechargement individuel
  const queries = questions.map((q) => ({
    queryKey: ['reponse', collectiviteId, q.id],
    queryFn: () => fetchReponse(supabase, collectiviteId, q.id),
    enabled: !!collectiviteId,
  }));

  return useQueries({ queries });
};

// chargement des données
const fetchReponse = async (
  supabase: DBClient,
  collectivite_id: number,
  question_id: string
) => {
  const query = supabase
    .from('reponse_display')
    .select()
    .match({ collectivite_id, question_id });

  // attends les données
  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data?.length ? transform(data[0] as TReponseRead) : undefined;
};

// met à jour si nécessaire la valeur d'une réponse lue depuis la base
const transform = (row: TReponseRead) => {
  const { reponse } = row;
  const { type, reponse: reponseValue } = reponse;

  // transforme en pourcentage une réponse de type proportion
  if (type === 'proportion') {
    const value =
      typeof reponseValue === 'number' ? roundTo(reponseValue * 100, 0) : '';
    return setReponseValue(row, value);
  }

  // transforme une valeur booléen en id (oui/non) du bouton radio correspondant
  if (reponseValue !== null && type === 'binaire') {
    if (reponseValue === true) return setReponseValue(row, 'oui');
    if (reponseValue === false) return setReponseValue(row, 'non');
    return setReponseValue(row, null);
  }

  // autres cas: renvoi la réponse inchangée
  return row;
};

// change la valeur dans une réponse et renvoi l'objet résultant
const setReponseValue = (row: TReponseRead, reponseValue: TReponse) => {
  const { reponse } = row;

  return {
    ...row,
    reponse: {
      ...reponse,
      reponse: reponseValue,
    },
  };
};
