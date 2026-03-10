import { Input } from '@tet/ui';
import { debounce, isNil } from 'es-toolkit';
import { ChangeEvent, useState } from 'react';
import { QuestionReponseProps } from './question-reponse-props.types';
import { ReponseContainer } from './reponse-choix';

const MIN = 0;
const MAX = 100;

const proportionToString = (value: number | null) =>
  isNil(value) ? '' : String(value);

const stringToProportion = (str: string, min: number, max: number) => {
  if (str === '') return null;
  const v = Math.min(Math.max(min, parseInt(str)), max);
  return isNaN(v) ? null : v;
};

/** Réponse donnant lieu à la saisie d'une valeur entre 0 et 100 */
export const ReponseProportion = ({
  question,
  reponse,
  onChange,
  canEdit,
}: QuestionReponseProps) => {
  const { id: questionId } = question;
  const [value, setValue] = useState(
    proportionToString(reponse?.reponse as number)
  );

  const handleChange = debounce((e: ChangeEvent<HTMLInputElement>) => {
    const proportion = stringToProportion(e.target.value, MIN, MAX);
    setValue(proportionToString(proportion));
    onChange(proportion);
  }, 1000);

  return (
    <ReponseContainer className="flex-col" questionId={questionId}>
      <Input
        className="max-w-32"
        displaySize="sm"
        type="number"
        icon={{ text: '%' }}
        disabled={!canEdit}
        min={MIN}
        max={MAX}
        id={questionId}
        value={value === null ? '' : String(value)}
        onChange={handleChange}
      />
    </ReponseContainer>
  );
};
