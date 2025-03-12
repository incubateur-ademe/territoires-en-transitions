import { useQuestionsReponses } from '@/app/referentiels/personnalisations/PersoReferentielThematique/useQuestionsReponses';

// pour cet indicateur uniquement on doit afficher une question de personnalisation
const PERSONNALISATION = {
  identifiantReferentiel: 'cae_25.b',
  questionId: 'potentiel_eolien_ou_hydro',
};

export const useIndicateurPersonnalisation = (
  identifiantReferentiel?: string | null,
  drom?: boolean,
) => {
  const qrList = useQuestionsReponses({
    questionIds: [PERSONNALISATION.questionId],
  });
  return identifiantReferentiel === PERSONNALISATION.identifiantReferentiel &&
    qrList.length && !drom
    ? qrList
    : null;
};
