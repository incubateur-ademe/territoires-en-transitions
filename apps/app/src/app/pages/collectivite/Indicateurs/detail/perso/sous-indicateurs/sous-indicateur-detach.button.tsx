'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button, Tooltip } from '@tet/ui';
import type { JSX } from 'react';

type Props = {
  label: string;
  onDetach: () => void;
};

export const SousIndicateurDetachButton = ({
  label,
  onDetach,
}: Props): JSX.Element => {
  const actionLabel = appLabels.indicateurSousIndicateurDissocier({ label });
  return (
    <Tooltip label={appLabels.indicateurSousIndicateurDissocierInfo}>
      <Button
        variant="unstyled"
        size="xs"
        className="flex rounded p-1 hover:bg-grey-3"
        icon="link-unlink"
        aria-label={actionLabel}
        onClick={onDetach}
      />
    </Tooltip>
  );
};
