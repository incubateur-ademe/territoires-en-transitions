'use client';

import { Button, Checkbox } from '@tet/ui';
import { ReactNode } from 'react';
import { useDisplaySettings } from '../display-settings.context';
import { VerticalDivider } from './vertical-divider';

export function DisplaySettingsButtons(): ReactNode {
  const {
    showJustifications,
    setShowJustifications,
    actionsAreAllExpanded,
    setActionsAreAllExpanded,
  } = useDisplaySettings();

  return (
    <>
      <Checkbox
        variant="switch"
        label="Afficher l'état d'avancement"
        size="sm"
        labelClassname="text-nowrap"
        checked={showJustifications}
        onChange={(evt) => setShowJustifications(evt.currentTarget.checked)}
      />
      <VerticalDivider />
      <Button
        variant="unstyled"
        size="xs"
        className="text-primary-9 text-sm font-normal text-nowrap"
        icon={actionsAreAllExpanded ? 'arrow-up-line' : 'arrow-down-line'}
        onClick={() => setActionsAreAllExpanded(!actionsAreAllExpanded)}
      >
        {actionsAreAllExpanded ? 'Tout replier' : 'Tout déplier'}
      </Button>
    </>
  );
}
