import { Field, Input } from '@/ui';
import { useState } from 'react';

type Props = {
  unite: string;
  disabled?: boolean;
  updateUnite: (value: string) => void;
};

const UniteIndicateurInput = ({ unite, disabled, updateUnite }: Props) => {
  const [uniteInput, setUniteInput] = useState(unite);

  return (
    <Field title="Unité">
      <Input
        type="text"
        value={uniteInput}
        onChange={(evt) => setUniteInput(evt.target.value)}
        onBlur={(evt) => updateUnite(evt.target.value)}
        disabled={disabled}
      />
    </Field>
  );
};

export default UniteIndicateurInput;
