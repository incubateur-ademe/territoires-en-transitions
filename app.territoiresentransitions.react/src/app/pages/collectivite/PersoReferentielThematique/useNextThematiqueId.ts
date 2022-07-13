import {useEffect, useState} from 'react';
import {questionThematiqueCompletudeReadEndpoint} from 'core-logic/api/endpoints/QuestionThematiqueCompletudeReadEndpoint';
import {TQuestionThematiqueCompletudeRead} from 'generated/dataLayer/question_thematique_completude_read';

type TUseNextThematiqueLink = (
  collectivite_id?: number,
  thematique_id?: string
) => string | null;

export const useNextThematiqueId: TUseNextThematiqueLink = (
  collectivite_id,
  thematique_id
) => {
  const [data, setData] = useState<TQuestionThematiqueCompletudeRead[]>([]);

  // charge les données
  const fetch = async () => {
    if (collectivite_id) {
      const thematiques = await questionThematiqueCompletudeReadEndpoint.getBy({
        collectivite_id,
      });

      setData(thematiques);
    }
  };
  useEffect(() => {
    fetch();
  }, [collectivite_id, thematique_id]);

  // données non valides ou pas encore chargée
  if (!data || !thematique_id) {
    return null;
  }

  // cherche l'index de la thématique courante
  const currentThematiqueIndex = data.findIndex(({id}) => id === thematique_id);
  if (currentThematiqueIndex === -1) {
    return null;
  }

  // et renvoi l'id de la thématique suivante dans la liste si elle existe
  const nextThematiqueIndex = currentThematiqueIndex + 1;
  if (nextThematiqueIndex >= data.length) {
    return null;
  }
  return data[nextThematiqueIndex].id;
};
