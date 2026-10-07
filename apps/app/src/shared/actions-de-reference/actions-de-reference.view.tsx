'use client';

import { appLabels } from '@/app/labels/catalog';
import { useUser } from '@tet/api/users';
import { hasPermission } from '@tet/domain/users';
import { PageHeader } from '@tet/ui';
import type {
  ActionDeReferenceUpdateAccess,
  ActionsDeReferenceViewComponent,
} from './actions-de-reference.contract';
import { ActionsDeReferenceFilters } from './actions-de-reference.filters';
import { ActionsDeReferenceResults } from './actions-de-reference.results';
import { useActionsDeReferenceSearchParams } from './data/use-actions-de-reference-search-params';
import { useListActionsDeReference } from './data/use-list-actions-de-reference';
import { useUpdateActionDeReferenceSidePanel } from './use-update-action-de-reference-side-panel';

const useActionDeReferenceUpdateAccess = (): ActionDeReferenceUpdateAccess => {
  const user = useUser();
  const { open } = useUpdateActionDeReferenceSidePanel();
  const canUpdateActionsDeReference = hasPermission(
    user,
    'shared.actions-de-reference.mutate'
  );

  if (!canUpdateActionsDeReference) {
    return { status: 'forbidden' };
  }
  return { status: 'allowed', onUpdate: open };
};

export const ActionsDeReferenceView: ActionsDeReferenceViewComponent = () => {
  const { search, changeSearch, resetSearch } =
    useActionsDeReferenceSearchParams();
  const actionsDeReferenceList = useListActionsDeReference(search);
  const updateAccess = useActionDeReferenceUpdateAccess();

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
        <ActionsDeReferenceResults
          list={actionsDeReferenceList}
          updateAccess={updateAccess}
          onResetSearch={resetSearch}
        />
      </div>
    </>
  );
};
