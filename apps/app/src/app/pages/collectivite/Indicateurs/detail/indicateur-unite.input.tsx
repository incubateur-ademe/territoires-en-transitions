import { Field, Input } from '@tet/ui';
import { useState } from 'react';

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

  return (
    <Field title="Unité" className="max-w-72" small>
      <Input
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
