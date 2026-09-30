'use client';

import { appLabels } from '@/app/labels/catalog';
import { PageHeader } from '@tet/ui';
import type {
  ActionDeReferenceUpdateAccess,
  ActionsDeReferenceViewComponent,
} from './actions-de-reference.contract';
import { ActionsDeReferenceFilters } from './actions-de-reference.filters';
import { ActionsDeReferenceResults } from './actions-de-reference.results';
import { useActionsDeReferenceSearchParams } from './data/use-actions-de-reference-search-params';
import { useListActionsDeReference } from './data/use-list-actions-de-reference';

const readOnlyAccess: ActionDeReferenceUpdateAccess = { status: 'forbidden' };

export const ActionsDeReferenceView: ActionsDeReferenceViewComponent = () => {
  const { search, changeSearch, resetSearch } =
    useActionsDeReferenceSearchParams();
  const actionsDeReferenceList = useListActionsDeReference(search);

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
          updateAccess={readOnlyAccess}
          onResetSearch={resetSearch}
        />
      </div>
    </>
  );
};
