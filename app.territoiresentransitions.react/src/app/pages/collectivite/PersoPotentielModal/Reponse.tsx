import {ChangeEvent, FC, ReactNode} from 'react';
import {TReponse} from 'generated/dataLayer/reponse_read';
import {TQuestionReponseProps} from './PersoPotentielQR';
import {TListeChoix} from 'generated/dataLayer/question_read';

const ReponseContainer = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={`fr-fieldset__content pl-4 ${className || ''}`}>
    {children}
  </div>
);

/** Affiche une réponse donnant le choix entre plusieurs énoncés */
const ReponseChoix = ({qr, onChange}: TQuestionReponseProps) => {
  const {id: questionId, choix, reponse} = qr;
  const hasReponse = reponse !== null && reponse !== undefined;
  const choices = getFilteredChoices(reponse, choix || []);

  return (
    <ReponseContainer>
      {choices?.map(({id: choiceId, label}) => {
        return (
          <div
            key={choiceId}
            className={`fr-radio-group fr-radio-group--sm ${
              hasReponse ? '' : 'vertical'
            }`}
          >
            <RadioButton
              questionId={questionId}
              choiceId={choiceId}
              label={label}
              reponse={reponse}
              onChange={onChange}
            />
          </div>
        );
      })}
    </ReponseContainer>
  );
};

/** Affiche une réponse donnant le choix entre oui et non */
const ReponseBinaire = ({qr, onChange}: TQuestionReponseProps) => {
  const {id: questionId, reponse} = qr;
  const choices = getFilteredChoices(reponse, [
    {id: 'true', label: 'Oui'},
    {id: 'false', label: 'Non'},
  ]);

  return (
    <ReponseContainer className="fr-fieldset--inline inline-radio">
      {choices?.map(({id: choiceId, label}) => (
        <div key={choiceId} className="fr-radio-group fr-radio-group--sm">
          <RadioButton
            questionId={questionId}
            choiceId={choiceId}
            label={label}
            reponse={reponse}
            onChange={onChange}
          />
        </div>
      ))}
    </ReponseContainer>
  );
};

/** Affiche une réponse donnant lieu à la saisie d'une valeur entre 0 et 100 */
const DEFAULT_RANGE = [0, 100];
const ReponseProportion = ({qr, onChange}: TQuestionReponseProps) => {
  const {id: questionId, reponse} = qr;
  const [min, max] = DEFAULT_RANGE;

  return (
    <ReponseContainer className="fr-fieldset--inline">
      <label className="fr-label" htmlFor={questionId}>
        Part en pourcentage
      </label>
      <input
        type="number"
        min={min}
        max={max}
        id={questionId}
        style={{width: 224}}
        className="fr-input"
        value={String(reponse || '')}
        onChange={e => onChange(getReponseProportion(e))}
      />
    </ReponseContainer>
  );
};

// parse une réponse saisie dans un champ proportion
const getReponseProportion = (e: ChangeEvent<HTMLInputElement>) => {
  const {value, min, max} = e.target;
  const v = Math.min(Math.max(parseInt(min), parseInt(value)), parseInt(max));
  return isNaN(v) ? null : v;
};

// correspondances entre un type de réponse et son composant
export const reponseParType: {[k: string]: FC<TQuestionReponseProps>} = {
  choix: ReponseChoix,
  binaire: ReponseBinaire,
  proportion: ReponseProportion,
};

const getFilteredChoices = (
  reponse: TReponse | undefined,
  choix: TListeChoix
): TListeChoix => {
  const hasReponse = reponse !== null && reponse !== undefined;
  return hasReponse
    ? choix?.filter(({id: choiceId}) => reponse?.toString() === choiceId)
    : choix;
};

const RadioButton = ({
  questionId,
  choiceId,
  label,
  reponse,
  onChange,
}: {
  questionId: string;
  choiceId: string;
  label: string;
  reponse: TReponse | undefined;
  onChange: (reponse: TReponse) => void;
}) => {
  const hasReponse = reponse !== null && reponse !== undefined;
  const eltId = `${questionId}-${choiceId}`;

  return (
    <>
      <input
        type="radio"
        id={eltId}
        checked={reponse?.toString() === choiceId}
        value={choiceId}
        onChange={() => onChange(choiceId)}
      />
      <label className="fr-label" htmlFor={eltId}>
        {label}
        {hasReponse && (
          <button
            className="fr-link fr-link--icon-left fr-fi-edit-line fr-ml-3w"
            onClick={() => onChange(null)}
          >
            Modifier
          </button>
        )}
      </label>
    </>
  );
};
