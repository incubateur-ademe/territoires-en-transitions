import { Field, Input } from '@tet/ui';
import { useId, useState } from 'react';

type Props = {
  unite: string;
  disabled?: boolean;
  updateUnite: (value: string) => void;
};

export const IndicateurUniteInput = ({
  unite,
  disabled,
  updateUnite,
}: Props) => {
  const [uniteInput, setUniteInput] = useState(unite);
  const inputId = useId();

  return (
    <Field title="Unité" htmlFor={inputId} className="max-w-72" small>
      <Input
        id={inputId}
        type="text"
        displaySize="sm"
        value={uniteInput}
        onChange={(evt) => setUniteInput(evt.target.value)}
        onBlur={(evt) => updateUnite(evt.target.value)}
        disabled={disabled}
      />
    </Field>
  );
};
