import { useCollectiviteId } from '@tet/api/collectivites';
import { useListPersonnalisationQuestionsReponses } from '../../../../../collectivites/personnalisations/data/use-list-personnalisation-questions-reponses';

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
  const qrList = useListPersonnalisationQuestionsReponses(collectiviteId, {
    questionIds: [PERSONNALISATION.questionId],
  });
  return identifiantReferentiel === PERSONNALISATION.identifiantReferentiel &&
    qrList.length &&
    !drom
    ? qrList
    : null;
};
