import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { SousActionTable } from '@/app/plans/sous-actions/list/table/sous-action.table';
import Module from '@/app/tableaux-de-bord/modules/module/module';
import PictoAction from '@/app/ui/pictogrammes/PictoAction';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ModuleFicheActionsSelect } from '@tet/api/plan-actions';
import { Pagination } from '@tet/ui';
import { useState } from 'react';

type Props = {
  module: ModuleFicheActionsSelect;
};

export const SousActionsDontJeSuisLePiloteModule = ({ module }: Props) => {
  const collectivite = useCurrentCollectivite();

  const [currentPage, setCurrentPage] = useState(1);

  const {
    fiches: sousActions,
    isLoading,
    count,
  } = useListFiches(collectivite.collectiviteId, {
    filters: module.options.filtre,
    queryOptions: {
      sort: [{ field: 'created_at', direction: 'desc' }],
      page: currentPage,
      limit: module.options.limit,
    },
  });

  const isEmpty = sousActions.length === 0;

  return (
    <Module
      title="Sous-actions pilotées"
      isEmpty={isEmpty && !isLoading}
      isLoading={false}
      symbole={<PictoAction className="w-16 h-16" />}
      filters={module.options.filtre}
    >
      <div className="h-full">
        <SousActionTable
          sousActions={sousActions}
          isLoading={isLoading}
          isEmpty={isEmpty}
          hiddenColumns={['pilotes', 'actions']}
          nbLoadingRows={module.options.limit}
        />
        {!isEmpty && (
          <Pagination
            className="mx-auto mt-6"
            selectedPage={currentPage}
            nbOfElements={count}
            maxElementsPerPage={module.options.limit}
            onChange={setCurrentPage}
          />
        )}
      </div>
    </Module>
  );
};
