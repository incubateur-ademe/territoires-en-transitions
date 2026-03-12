import {
  PersonnalisationReponseValue,
  QuestionChoix,
} from '@tet/domain/collectivites';
import { Button, Field, Input, RadioButton as RadioButtonBase } from '@tet/ui';
import classNames from 'classnames';
import { debounce, isNil } from 'es-toolkit';
import { ChangeEvent, FC, ReactNode, useState } from 'react';
import { TQuestionReponseProps } from './PersoPotentielQR';

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
const ReponseChoix = ({ qr, onChange, canEdit }: TQuestionReponseProps) => {
  const { id: questionId, choix, reponse } = qr;
  const choices = getFilteredChoices(reponse, choix || []);

  return (
    <ReponseContainer className="flex-col">
      {choices?.map(({ id: choiceId, formulation }) => (
        <RadioButton
          key={questionId + choiceId}
          disabled={!canEdit}
          questionId={questionId}
          choiceId={choiceId}
          label={formulation}
          reponse={reponse}
          onChange={onChange}
        />
      ))}
    </ReponseContainer>
  );
};

/** Affiche une réponse donnant le choix entre oui et non */
const ReponseBinaire = ({ qr, onChange, canEdit }: TQuestionReponseProps) => {
  const { id: questionId, reponse } = qr;
  const choices = getFilteredChoices(reponse, [
    { id: 'oui', formulation: 'Oui' },
    { id: 'non', formulation: 'Non' },
  ]);

  return (
    <ReponseContainer>
      {choices?.map(({ id: choiceId, formulation }) => (
        <RadioButton
          key={choiceId}
          disabled={!canEdit}
          questionId={questionId}
          choiceId={choiceId}
          label={formulation}
          reponse={reponse}
          onChange={onChange}
        />
      ))}
    </ReponseContainer>
  );
};

/** Affiche une réponse donnant lieu à la saisie d'une valeur entre 0 et 100 */
const DEFAULT_RANGE = [0, 100];
const ReponseProportion = ({
  qr,
  onChange,
  canEdit,
}: TQuestionReponseProps) => {
  const { id: questionId, reponse } = qr;
  const [min, max] = DEFAULT_RANGE;

  const [value, setValue] = useState(proportionToString(reponse as number));

  const handleChange = debounce((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    const proportion = stringToProportion(value, min, max);
    setValue(proportionToString(proportion));
    onChange(proportion);
  }, 1000);

  return (
    <ReponseContainer className="flex-col">
      <Field
        title="Part en pourcentage"
        htmlFor={questionId}
        className="max-w-56"
      >
        <Input
          type="number"
          disabled={!canEdit}
          min={min}
          max={max}
          id={questionId}
          value={value === null ? '' : String(value)}
          onChange={handleChange}
        />
      </Field>
    </ReponseContainer>
  );
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
  isNil(value) ? '' : String(value);

// correspondances entre un type de réponse et son composant
export const reponseParType: { [k: string]: FC<TQuestionReponseProps> } = {
  choix: ReponseChoix,
  binaire: ReponseBinaire,
  proportion: ReponseProportion,
};

const getFilteredChoices = (
  reponse: PersonnalisationReponseValue | undefined,
  choix: Pick<QuestionChoix, 'id' | 'formulation'>[]
) => {
  // Convertir le booléen en string 'oui'/'non' pour la comparaison
  const normalizedReponse =
    typeof reponse === 'boolean' ? (reponse ? 'oui' : 'non') : reponse;
  return isNil(normalizedReponse)
    ? choix
    : choix?.filter(
        ({ id: choiceId }) => normalizedReponse?.toString() === choiceId
      );
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
  reponse: PersonnalisationReponseValue | undefined;
  onChange: (reponse: PersonnalisationReponseValue) => void;
}) => {
  const hasReponse = !isNil(reponse);
  const eltId = `${questionId}-${choiceId}`;

  return (
    <div className="flex items-center gap-6 mb-4">
      <RadioButtonBase
        containerClassname="mr-4"
        disabled={disabled}
        id={eltId}
        checked={reponse?.toString() === choiceId}
        value={choiceId}
        name={questionId}
        onChange={() => onChange(choiceId)}
        label={label}
      />
      {!disabled && hasReponse && (
        <Button
          variant="underlined"
          size="sm"
          icon="edit-line"
          onClick={() => {
            onChange(null);
          }}
        >
          Modifier
        </Button>
      )}
    </div>
  );
};
