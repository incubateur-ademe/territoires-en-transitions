'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import type { JSX } from 'react';

type Props = {
  isOpen: boolean;
  onClick: () => void;
};

export const PcaetAvanceSidePanelButton = ({
  isOpen,
  onClick,
}: Props): JSX.Element => (
  <Button
    variant="grey"
    size="xs"
    icon="list-check"
    onClick={onClick}
    aria-pressed={isOpen}
    data-test="demarches.pcaet.avance-side-panel-button"
    className={cn(
      isOpen
        ? 'bg-primary-9 hover:!bg-primary-9 text-white hover:!text-white'
        : 'text-grey-8 border-grey-4'
    )}
  >
    {appLabels.demarchePcaetAvancePanneauBouton}
  </Button>
);
