import { appLabels } from '@/app/labels/catalog';
import { Pertinence, pertinenceEnumValues } from '@tet/domain/collectivites';
import { ButtonGroup } from '@tet/ui';
import { JSX, useId } from 'react';

type PertinenceSelectorProps = {
  label: string;
  value?: Pertinence;
  onChange: (pertinence: Pertinence) => void;
};

export const PertinenceSelector = ({
  label,
  value,
  onChange,
}: PertinenceSelectorProps): JSX.Element => {
  const groupId = useId();
  const toButtonId = (pertinence: Pertinence): string =>
    `${groupId}-${pertinence}`;
  const activeButtonId = value === undefined ? undefined : toButtonId(value);
  const selectPertinence = (pertinence: Pertinence): void => {
    const isAlreadySelected = pertinence === value;
    if (isAlreadySelected) {
      return;
    }
    onChange(pertinence);
  };

  return (
    <ButtonGroup
      label={label}
      size="sm"
      fillContainer
      activeButtonId={activeButtonId}
      buttons={pertinenceEnumValues.map((pertinence) => ({
        id: toButtonId(pertinence),
        children: appLabels.pertinenceLabel(pertinence),
        onClick: () => selectPertinence(pertinence),
      }))}
    />
  );
};
