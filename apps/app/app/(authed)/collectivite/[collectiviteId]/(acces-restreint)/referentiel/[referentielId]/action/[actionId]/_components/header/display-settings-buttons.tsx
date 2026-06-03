'use client';

import { Button } from '@tet/ui';
import { ReactNode } from 'react';
import { useDisplaySettings } from '../display-settings.context';

export function DisplaySettingsButtons(): ReactNode {
  const { actionsAreAllExpanded, setActionsAreAllExpanded } =
    useDisplaySettings();

  return (
    <Button
      variant="unstyled"
      size="xs"
      className="text-primary-9 text-sm font-normal text-nowrap"
      icon={actionsAreAllExpanded ? 'arrow-up-line' : 'arrow-down-line'}
      onClick={() => setActionsAreAllExpanded(!actionsAreAllExpanded)}
    >
      {actionsAreAllExpanded ? 'Replier' : 'Déplier'} les sous-mesures
    </Button>
  );
}
