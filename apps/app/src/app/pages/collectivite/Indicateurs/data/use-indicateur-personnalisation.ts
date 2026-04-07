import { useCollectiviteId } from '@tet/api/collectivites';
import { usePersonnalisationQuestionsReponses } from '../../personnalisations/data/use-personnalisation-questions-reponses';

// pour cet indicateur uniquement on doit afficher une question de personnalisation
const PERSONNALISATION = {
  identifiantReferentiel: 'cae_25.b',
  questionId: 'potentiel_eolien_ou_hydro',
};

export const useIndicateurPersonnalisation = (
  identifiantReferentiel?: string | null,
  drom?: boolean
) => {
  const collectiviteId = useCollectiviteId();
  const qrList = usePersonnalisationQuestionsReponses(collectiviteId, {
    questionIds: [PERSONNALISATION.questionId],
  });
  return identifiantReferentiel === PERSONNALISATION.identifiantReferentiel &&
    qrList.length &&
    !drom
    ? qrList
    : null;
};
