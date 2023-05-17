import {FC, ReactNode} from 'react';
import classNames from 'classnames';
import {TQuestionReponseProps} from './PersoPotentielQR';
import {TListeChoix, TReponse} from 'types/personnalisation';
import {useDebouncedInput} from 'ui/shared/useDebouncedInput';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

const ReponseContainer = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div data-test="reponse" className={classNames('flex pl-4', className)}>
    {children}
  </div>
);

/** Affiche une réponse donnant le choix entre plusieurs énoncés */
const ReponseChoix = ({qr, onChange}: TQuestionReponseProps) => {
  const {id: questionId, choix, reponse} = qr;
  const choices = getFilteredChoices(reponse, choix || []);
  const collectivite = useCurrentCollectivite();

  return collectivite ? (
    <ReponseContainer className="flex-col">
      {choices?.map(({id: choiceId, label}) => {
        return (
          <RadioButton
            disabled={collectivite.readonly}
            questionId={questionId}
            choiceId={choiceId}
            label={label}
            reponse={reponse}
            onChange={onChange}
          />
        );
      })}
    </ReponseContainer>
  ) : null;
};

/** Affiche une réponse donnant le choix entre oui et non */
const ReponseBinaire = ({qr, onChange}: TQuestionReponseProps) => {
  const {id: questionId, reponse} = qr;
  const choices = getFilteredChoices(reponse, [
    {id: 'oui', label: 'Oui'},
    {id: 'non', label: 'Non'},
  ]);
  const collectivite = useCurrentCollectivite();

  return collectivite ? (
    <ReponseContainer>
      {choices?.map(({id: choiceId, label}) => (
        <RadioButton
          key={choiceId}
          disabled={collectivite.readonly}
          questionId={questionId}
          choiceId={choiceId}
          label={label}
          reponse={reponse}
          onChange={onChange}
        />
      ))}
    </ReponseContainer>
  ) : null;
};

/** Affiche une réponse donnant lieu à la saisie d'une valeur entre 0 et 100 */
const DEFAULT_RANGE = [0, 100];
const ReponseProportion = ({qr, onChange}: TQuestionReponseProps) => {
  const {id: questionId, reponse} = qr;
  const [min, max] = DEFAULT_RANGE;

  const [value, handleChange, setValue] = useDebouncedInput(
    proportionToString(reponse as number),
    query => {
      const proportion = stringToProportion(query, min, max);
      setValue(proportionToString(proportion));
      onChange(proportion);
    }
  );
  const collectivite = useCurrentCollectivite();

  return collectivite ? (
    <ReponseContainer className="flex-col">
      <label className="fr-label" htmlFor={questionId}>
        Part en pourcentage
      </label>
      <input
        type="number"
        disabled={collectivite.readonly}
        min={min}
        max={max}
        id={questionId}
        style={{width: 224}}
        className="fr-input"
        value={value === null ? '' : String(value)}
        onChange={handleChange}
      />
    </ReponseContainer>
  ) : null;
};

// parse une réponse saisie dans un champ proportion
const stringToProportion = (str: string, min: number, max: number) => {
  if (str === '') {
    return null;
  }
  const v = Math.min(Math.max(min, parseInt(str)), max);
  return isNaN(v) ? null : v;
};

const proportionToString = (value: number | null) =>
  value === null || value === undefined ? '' : String(value);

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
  disabled,
  questionId,
  choiceId,
  label,
  reponse,
  onChange,
}: {
  disabled?: boolean;
  questionId: string;
  choiceId: string;
  label: string;
  reponse: TReponse | undefined;
  onChange: (reponse: TReponse) => void;
}) => {
  const hasReponse = reponse !== null && reponse !== undefined;
  const eltId = `${questionId}-${choiceId}`;

  return (
    <div className="fr-fieldset__element fr-fieldset__element--inline">
      <div className="fr-radio-group fr-radio-group--sm">
        <input
          type="radio"
          disabled={disabled}
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
              onClick={e => {
                e.preventDefault();
                onChange(null);
              }}
            >
              Modifier
            </button>
          )}
        </label>
      </div>
    </div>
  );
};
