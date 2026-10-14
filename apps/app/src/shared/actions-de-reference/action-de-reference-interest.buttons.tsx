import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import type { JSX } from 'react';
import type { ActionDeReferenceInterestControl } from './actions-de-reference.contract';

export const ActionDeReferenceInterestButtons = ({
  interest,
}: {
  readonly interest: ActionDeReferenceInterestControl;
}): JSX.Element => {
  if (interest.status === 'ignoree') {
    return (
      <Button variant="link" size="xs" onClick={interest.onRestore}>
        {appLabels.actionDeReferenceRestaurer}
      </Button>
    );
  }
  if (interest.status === 'preselectionnee') {
    return (
      <Button
        variant="primary"
        size="xs"
        icon="bookmark-fill"
        aria-pressed
        onClick={interest.onToggleSaved}
      >
        {appLabels.actionDeReferenceSauvegarder}
      </Button>
    );
  }
  return (
    <>
      <Button
        variant="outlined"
        size="xs"
        icon="bookmark-line"
        onClick={interest.onToggleSaved}
      >
        {appLabels.actionDeReferenceSauvegarder}
      </Button>
      <Button variant="link" size="xs" onClick={interest.onDismiss}>
        {appLabels.actionDeReferencePasInteresse}
      </Button>
    </>
  );
};
