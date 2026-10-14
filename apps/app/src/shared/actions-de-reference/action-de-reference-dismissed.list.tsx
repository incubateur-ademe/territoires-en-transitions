import { appLabels } from '@/app/labels/catalog';
import type {
  ActionDeReference,
  ActionDeReferenceId,
} from '@tet/domain/shared';
import { Button } from '@tet/ui';
import type { JSX } from 'react';
import {
  ActionDeReferenceExpandToggle,
  useExpandable,
} from './action-de-reference-expand.toggle';

export const ActionDeReferenceDismissedList = ({
  actions,
  onRestore,
}: {
  readonly actions: readonly ActionDeReference[];
  readonly onRestore: (actionId: ActionDeReferenceId) => void;
}): JSX.Element => {
  const { isExpanded, toggle } = useExpandable();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-grey-3 bg-grey-1 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="mb-0 text-sm font-medium text-grey-8">
          {appLabels.actionDeReferenceMarqueesPasInteresse(actions.length)}
        </p>
        <ActionDeReferenceExpandToggle
          isExpanded={isExpanded}
          collapsedLabel={appLabels.actionDeReferenceMarqueesDeplier}
          expandedLabel={appLabels.actionDeReferenceMarqueesReplier}
          onToggle={toggle}
        />
      </div>
      {isExpanded && (
        <ul role="list" className="m-0 flex list-none flex-col gap-3 p-0">
          {actions.map((action) => (
            <li
              key={action.id}
              className="flex items-center justify-between gap-3"
            >
              <p className="mb-0 text-sm font-medium text-grey-8">
                {action.titre}
              </p>
              <Button
                variant="outlined"
                size="xs"
                icon="arrow-go-back-line"
                onClick={() => onRestore(action.id)}
              >
                {appLabels.actionDeReferenceRestaurer}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
