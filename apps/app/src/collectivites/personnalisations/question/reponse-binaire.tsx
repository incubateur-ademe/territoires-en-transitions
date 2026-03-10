import { RadioButton } from '@tet/ui';
import { isNil } from 'es-toolkit';
import { QuestionReponseProps } from './question-reponse-props.types';
import { ReponseContainer } from './reponse-choix';

const LABEL_BANATIC = '(réponse Banatic)';

/** Réponse donnant le choix entre oui et non */
export const ReponseBinaire = ({
  question,
  reponse,
  onChange,
  canEdit,
}: QuestionReponseProps) => {
  const { id: questionId } = question;
  const reponseValue = reponse?.reponse;
  const showLabelBanatic = reponse && !isNil(reponse.competenceExercee);

  return (
    <ReponseContainer
      className="flex flex-row gap-4 min-w-fit"
      questionId={questionId}
    >
      <RadioButton
        name={questionId}
        disabled={!canEdit}
        value="true"
        label={
          showLabelBanatic && reponse?.competenceExercee === true
            ? `Oui ${LABEL_BANATIC}`
            : 'Oui'
        }
        checked={reponseValue === true}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
      <RadioButton
        name={questionId}
        disabled={!canEdit}
        label={
          showLabelBanatic && reponse?.competenceExercee === false
            ? `Non ${LABEL_BANATIC}`
            : 'Non'
        }
        value="false"
        checked={reponseValue === false}
        onChange={(e) => onChange(!e.currentTarget.checked)}
      />
    </ReponseContainer>
  );
};
