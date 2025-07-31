import { useCurrentCollectivite } from '@/api/collectivites';
import {
  TListeChoix,
  TReponse,
} from '@/app/referentiels/personnalisations/personnalisation.types';
import { useDebouncedInput } from '@/app/ui/shared/useDebouncedInput';
import { Button, Field, Input, RadioButton as RadioButtonBase } from '@/ui';
import classNames from 'classnames';
import { FC, ReactNode } from 'react';
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
const ReponseChoix = ({ qr, onChange }: TQuestionReponseProps) => {
  const { id: questionId, choix, reponse } = qr;
  const choices = getFilteredChoices(reponse, choix || []);
  const collectivite = useCurrentCollectivite();

  return (
    <ReponseContainer className="flex-col">
      {choices?.map(({ id: choiceId, label }) => {
        return (
          <RadioButton
            key={questionId + choiceId}
            disabled={collectivite.isReadOnly}
            questionId={questionId}
            choiceId={choiceId}
            label={label}
            reponse={reponse}
            onChange={onChange}
          />
        );
      })}
    </ReponseContainer>
  );
};

/** Affiche une réponse donnant le choix entre oui et non */
const ReponseBinaire = ({ qr, onChange }: TQuestionReponseProps) => {
  const { id: questionId, reponse } = qr;
  const choices = getFilteredChoices(reponse, [
    { id: 'oui', label: 'Oui' },
    { id: 'non', label: 'Non' },
  ]);
  const collectivite = useCurrentCollectivite();

  return (
    <ReponseContainer>
      {choices?.map(({ id: choiceId, label }) => (
        <RadioButton
          key={choiceId}
          disabled={collectivite.isReadOnly}
          questionId={questionId}
          choiceId={choiceId}
          label={label}
          reponse={reponse}
          onChange={onChange}
        />
      ))}
    </ReponseContainer>
  );
};

/** Affiche une réponse donnant lieu à la saisie d'une valeur entre 0 et 100 */
const DEFAULT_RANGE = [0, 100];
const ReponseProportion = ({ qr, onChange }: TQuestionReponseProps) => {
  const { id: questionId, reponse } = qr;
  const [min, max] = DEFAULT_RANGE;

  const [value, handleChange, setValue] = useDebouncedInput(
    proportionToString(reponse as number),
    (query) => {
      const proportion = stringToProportion(query, min, max);
      setValue(proportionToString(proportion));
      onChange(proportion);
    }
  );
  const collectivite = useCurrentCollectivite();

  return (
    <ReponseContainer className="flex-col">
      <Field
        title="Part en pourcentage"
        htmlFor={questionId}
        className="max-w-56"
      >
        <Input
          type="number"
          disabled={collectivite.isReadOnly}
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
  value === null || value === undefined ? '' : String(value);

// correspondances entre un type de réponse et son composant
export const reponseParType: { [k: string]: FC<TQuestionReponseProps> } = {
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
    ? choix?.filter(({ id: choiceId }) => reponse?.toString() === choiceId)
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
