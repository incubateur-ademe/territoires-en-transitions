'use client';

import { usePreselection } from '@/app/collectivites/priorisation-leviers/use-preselection';
import { appLabels } from '@/app/labels/catalog';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import type {
  ActionDeReference,
  ActionDeReferenceId,
} from '@tet/domain/shared';
import { EmptyCard, PageHeader } from '@tet/ui';
import { partition } from 'es-toolkit';
import type { JSX } from 'react';
import { ActionDeReferenceCollectivitesPanel } from './action-de-reference-collectivites.panel';
import { ActionDeReferenceDismissedList } from './action-de-reference-dismissed.list';
import type {
  ActionDeReferenceInterestControl,
  ActionsDeReferenceList,
  ActionsDeReferenceViewComponent,
} from './actions-de-reference.contract';
import { ActionsDeReferenceFilters } from './actions-de-reference.filters';
import { ActionsDeReferenceResults } from './actions-de-reference.results';
import { useActionsDeReferenceSearchParams } from './data/use-actions-de-reference-search-params';
import { useListActionsDeReference } from './data/use-list-actions-de-reference';
import { toActionDeReferenceInterestControl } from './to-action-de-reference-interest-control';
import { useActionDeReferenceUpdateAccess } from './use-action-de-reference-update-access';

const renderActionDeReferenceCollectivites = (
  action: ActionDeReference
): JSX.Element => (
  <ActionDeReferenceCollectivitesPanel actionDeReferenceId={action.id} />
);

const splitDismissed = (
  list: ActionsDeReferenceList,
  isDismissed: (actionId: ActionDeReferenceId) => boolean
): {
  readonly visible: ActionsDeReferenceList;
  readonly dismissed: readonly ActionDeReference[];
} => {
  if (list.status !== 'loaded') {
    return { visible: list, dismissed: [] };
  }
  const [dismissed, visible] = partition(list.actions, ({ id }) =>
    isDismissed(id)
  );
  return { visible: { status: 'loaded', actions: visible }, dismissed };
};

const AllActionsDismissedEmpty = (): JSX.Element => (
  <EmptyCard
    picto={(props) => <PictoDashboard {...props} />}
    title={appLabels.actionDeReferenceToutesMarquees}
  />
);

export const ActionsDeReferenceView: ActionsDeReferenceViewComponent = () => {
  const { search, changeSearch, resetSearch } =
    useActionsDeReferenceSearchParams();
  const actionsDeReferenceList = useListActionsDeReference(search);
  const updateAccess = useActionDeReferenceUpdateAccess();
  const preselection = usePreselection();
  const isDismissed = (actionId: ActionDeReferenceId): boolean =>
    preselection.statusOf(actionId) === 'ignoree';
  const interestOf = (
    action: ActionDeReference
  ): ActionDeReferenceInterestControl =>
    toActionDeReferenceInterestControl(
      action,
      preselection.statusOf(action.id),
      preselection
    );

  const { visible: visibleList, dismissed: dismissedActions } = splitDismissed(
    actionsDeReferenceList,
    isDismissed
  );
  const hasDismissedActions = dismissedActions.length > 0;
  const isEveryActionDismissed =
    hasDismissedActions &&
    visibleList.status === 'loaded' &&
    visibleList.actions.length === 0;

  return (
    <>
      <PageHeader>
        <PageHeader.Title>{appLabels.actionsDeReference}</PageHeader.Title>
      </PageHeader>
      <div className="flex flex-col gap-6">
        <ActionsDeReferenceFilters
          search={search}
          onSearchChange={changeSearch}
        />
        {isEveryActionDismissed ? (
          <AllActionsDismissedEmpty />
        ) : (
          <ActionsDeReferenceResults
            list={visibleList}
            updateAccess={updateAccess}
            onResetSearch={resetSearch}
            renderCollectivites={renderActionDeReferenceCollectivites}
            interestOf={interestOf}
          />
        )}
        {hasDismissedActions && (
          <ActionDeReferenceDismissedList
            actions={dismissedActions}
            onRestore={preselection.restore}
          />
        )}
      </div>
    </>
  );
};
