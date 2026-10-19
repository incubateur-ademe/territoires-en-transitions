import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import type { JSX } from 'react';
import { match } from 'ts-pattern';
import type { ActionDeReferenceInterestControl } from './actions-de-reference.contract';

export const ActionDeReferenceInterestButtons = ({
  interest,
}: {
  readonly interest: ActionDeReferenceInterestControl;
}): JSX.Element =>
  match(interest)
    .with({ status: 'ignoree' }, ({ onRestore }) => (
      <Button variant="link" size="xs" onClick={onRestore}>
        {appLabels.actionDeReferenceRestaurer}
      </Button>
    ))
    .with(
      { status: 'preselectionnee' },
      ({ onToggleSaved, savedActionLabel }) => (
        <Button
          variant="primary"
          size="xs"
          icon="bookmark-fill"
          aria-pressed
          onClick={onToggleSaved}
        >
          {savedActionLabel ?? appLabels.actionDeReferenceSauvegarder}
        </Button>
      )
    )
    .with({ status: 'disponible' }, ({ onToggleSaved, onDismiss }) => (
      <>
        <Button
          variant="outlined"
          size="xs"
          icon="bookmark-line"
          onClick={onToggleSaved}
        >
          {appLabels.actionDeReferenceSauvegarder}
        </Button>
        <Button variant="link" size="xs" onClick={onDismiss}>
          {appLabels.actionDeReferencePasInteresse}
        </Button>
      </>
    ))
    .exhaustive();
