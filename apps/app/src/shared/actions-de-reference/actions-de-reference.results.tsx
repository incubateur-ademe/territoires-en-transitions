import { appLabels } from '@/app/labels/catalog';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { LoadingStatus } from '@/app/ui/shared/loading-status';
import { ErrorCard } from '@/app/utils/error/error.card';
import type { ActionDeReference } from '@tet/domain/shared';
import { EmptyCard } from '@tet/ui';
import type { JSX } from 'react';
import { match } from 'ts-pattern';
import { ActionDeReferenceCard } from './action-de-reference.card';
import type {
  ActionDeReferenceUpdateAccess,
  ActionsDeReferenceResultsComponent,
  ActionsDeReferenceResultsProps,
} from './actions-de-reference.contract';

const ActionsDeReferenceEmpty = ({
  onResetSearch,
}: {
  readonly onResetSearch: () => void;
}): JSX.Element => (
  <EmptyCard
    picto={(props) => <PictoDashboard {...props} />}
    title={appLabels.actionsDeReferenceAucune}
    actions={[
      {
        children: appLabels.actionsDeReferenceEffacerFiltres,
        onClick: onResetSearch,
        variant: 'outlined',
        size: 'sm',
      },
    ]}
  />
);

type ActionsDeReferenceGridProps = {
  readonly actions: readonly ActionDeReference[];
  readonly updateAccess: ActionDeReferenceUpdateAccess;
  readonly renderCollectivites: ActionsDeReferenceResultsProps['renderCollectivites'];
  readonly interestOf: ActionsDeReferenceResultsProps['interestOf'];
};

const ActionsDeReferenceGrid = ({
  actions,
  updateAccess,
  renderCollectivites,
  interestOf,
}: ActionsDeReferenceGridProps): JSX.Element => (
  <ul
    role="list"
    className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3"
  >
    {actions.map((action) => (
      <li key={action.id} className="p-0">
        <ActionDeReferenceCard
          action={action}
          updateAccess={updateAccess}
          interest={interestOf(action)}
        >
          {renderCollectivites(action)}
        </ActionDeReferenceCard>
      </li>
    ))}
  </ul>
);

export const ActionsDeReferenceResults: ActionsDeReferenceResultsComponent = ({
  list,
  updateAccess,
  onResetSearch,
  renderCollectivites,
  interestOf,
}) =>
  match(list)
    .with({ status: 'loading' }, () => <LoadingStatus />)
    .with({ status: 'error' }, ({ retry }) => (
      <ErrorCard
        title={appLabels.uneErreurEstSurvenue}
        retry={retry}
        retryLabel={appLabels.reessayer}
      />
    ))
    .with({ status: 'loaded', actions: [] }, () => (
      <ActionsDeReferenceEmpty onResetSearch={onResetSearch} />
    ))
    .with({ status: 'loaded' }, ({ actions }) => (
      <ActionsDeReferenceGrid
        actions={actions}
        updateAccess={updateAccess}
        renderCollectivites={renderCollectivites}
        interestOf={interestOf}
      />
    ))
    .exhaustive();
