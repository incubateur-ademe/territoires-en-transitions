import { appLabels } from '@/app/labels/catalog';
import type { ActionDeReference } from '@tet/domain/shared';
import { Button } from '@tet/ui';
import type { JSX } from 'react';
import { usePreselection } from './use-preselection';

const PreselectionToggleButton = ({
  action,
}: {
  readonly action: ActionDeReference;
}): JSX.Element => {
  const preselection = usePreselection();
  const isPreselected = preselection.statusOf(action.id) === 'preselectionnee';

  const toggle = (): void => {
    if (isPreselected) {
      preselection.remove(action.id);
      return;
    }
    preselection.add(action);
  };

  return (
    <Button
      icon={isPreselected ? 'check-line' : undefined}
      variant={isPreselected ? 'primary' : 'outlined'}
      aria-pressed={isPreselected}
      disabled={!preselection.isReady}
      onClick={toggle}
    >
      {appLabels.actionDeReferenceInteresse}
    </Button>
  );
};

export { PreselectionToggleButton };
