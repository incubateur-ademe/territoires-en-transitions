import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import type { JSX } from 'react';
import { match } from 'ts-pattern';
import { ActionDeReferenceSaveToggle } from './action-de-reference-save.toggle';
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
    .with({ status: 'preselectionnee' }, ({ onToggleSaved }) => (
      <ActionDeReferenceSaveToggle isSaved size="xs" onToggle={onToggleSaved} />
    ))
    .with({ status: 'disponible' }, ({ onToggleSaved, onDismiss }) => (
      <>
        <ActionDeReferenceSaveToggle
          isSaved={false}
          size="xs"
          onToggle={onToggleSaved}
        />
        <Button variant="link" size="xs" onClick={onDismiss}>
          {appLabels.actionDeReferencePasInteresse}
        </Button>
      </>
    ))
    .exhaustive();
