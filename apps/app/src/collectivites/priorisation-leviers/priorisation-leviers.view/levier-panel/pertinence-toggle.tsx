import { appLabels } from '@/app/labels/catalog';
import { Pertinence } from '@tet/domain/collectivites';
import { Button } from '@tet/ui';
import { JSX } from 'react';

type PertinenceToggleProps = {
  label: string;
  value?: Pertinence;
  onChange: (pertinence: Pertinence) => void;
};

export const PertinenceToggle = ({
  label,
  value,
  onChange,
}: PertinenceToggleProps): JSX.Element => {
  const isNonPertinent = value === 'non_pertinent';
  const nextPertinence: Pertinence = isNonPertinent
    ? 'pertinent'
    : 'non_pertinent';

  return (
    <div role="group" aria-label={label}>
      <Button
        size="xs"
        variant="outlined"
        icon={isNonPertinent ? 'eye-line' : 'eye-off-line'}
        onClick={() => onChange(nextPertinence)}
      >
        {appLabels.levierPertinence(nextPertinence)}
      </Button>
    </div>
  );
};
