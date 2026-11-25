import { appLabels } from '@/app/labels/catalog';
import { Field, Input } from '@tet/ui';
import { useId, useState } from 'react';

type Props = {
  unite: string;
  disabled?: boolean;
  parentTitre?: string;
  updateUnite: (value: string) => void;
};

export const IndicateurUniteInput = ({
  unite,
  disabled,
  parentTitre,
  updateUnite,
}: Props) => {
  const [uniteInput, setUniteInput] = useState(unite);
  const inputId = useId();
  const isInheritedFromParent = parentTitre !== undefined;

  return (
    <Field
      title={appLabels.indicateurUnite}
      hint={
        isInheritedFromParent
          ? appLabels.indicateurUniteDuParent({ parent: parentTitre })
          : undefined
      }
      htmlFor={inputId}
      className="max-w-72"
      small
    >
      <Input
        id={inputId}
        type="text"
        displaySize="sm"
        value={uniteInput}
        onChange={(evt) => setUniteInput(evt.target.value)}
        onBlur={(evt) => updateUnite(evt.target.value)}
        disabled={disabled || isInheritedFromParent}
      />
    </Field>
  );
};
