import { ActionDeReferenceSaveToggle } from '@/app/shared/actions-de-reference/action-de-reference-save.toggle';
import type { ActionDeReference } from '@tet/domain/shared';
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
    <ActionDeReferenceSaveToggle
      isSaved={isPreselected}
      size="sm"
      disabled={!preselection.isReady}
      onToggle={toggle}
    />
  );
};

export { PreselectionToggleButton };
