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
    <div role="group" aria-label={label} className="w-full">
      <Button
        className="w-full justify-center"
        variant={isNonPertinent ? 'primary' : 'outlined'}
        onClick={() => onChange(nextPertinence)}
      >
        {appLabels.marquerPertinence(nextPertinence)}
      </Button>
    </div>
  );
};
