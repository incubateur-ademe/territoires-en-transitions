import { appLabels } from '@/app/labels/catalog';
import { Checkbox, Tooltip } from '@tet/ui';
import type { JSX } from 'react';

type Props = {
  isConfidentiel: boolean;
  onChange: (isConfidentiel: boolean) => void;
};

export const PrivateModeToggle = ({
  isConfidentiel,
  onChange,
}: Props): JSX.Element => (
  <Tooltip label={appLabels.indicateurResultatRecentModePriveInfo}>
    <div>
      <Checkbox
        variant="switch"
        label={appLabels.indicateurResultatRecentModePrive}
        checked={isConfidentiel}
        onChange={() => onChange(!isConfidentiel)}
      />
    </div>
  </Tooltip>
);
