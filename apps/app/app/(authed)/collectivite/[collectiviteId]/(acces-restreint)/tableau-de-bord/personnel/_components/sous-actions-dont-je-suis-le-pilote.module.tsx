import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { SousActionTable } from '@/app/plans/sous-actions/list/table/sous-action.table';
import Module from '@/app/tableaux-de-bord/modules/module/module';
import PictoAction from '@/app/ui/pictogrammes/PictoAction';
import { useUser } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Pagination } from '@tet/ui';
import { useState } from 'react';

const LIMIT = 10;

export const SousActionsDontJeSuisLePiloteModule = () => {
  const collectivite = useCurrentCollectivite();

  const { id: userId } = useUser();

  const [currentPage, setCurrentPage] = useState(1);

  const { fiches, isLoading } = useListFiches(collectivite.collectiviteId, {
    filters: {
      utilisateurPiloteIds: [userId],
      withChildren: true,
    },
    queryOptions: {
      sort: [{ field: 'created_at', direction: 'desc' }],
      page: currentPage,
      limit: LIMIT,
    },
  });

  // Avec `withChildren` on récupère les sous-actions mais aussi les actions parentes
  const sousActions = fiches.filter((fiche) => fiche.parentId);

  const isEmpty = sousActions.length === 0;

  return (
    <Module
      title="Sous-actions pilotées"
      isEmpty={isEmpty}
      isLoading={false}
      symbole={<PictoAction className="w-16 h-16" />}
      filters={{ utilisateurPiloteIds: [userId] }}
    >
      <div className="h-full">
        <SousActionTable
          sousActions={sousActions}
          isLoading={isLoading}
          isEmpty={isEmpty}
          hiddenColumns={['pilotes', 'actions']}
          nbLoadingRows={LIMIT}
        />
        {!isEmpty && (
          <Pagination
            className="mx-auto mt-6"
            selectedPage={currentPage}
            nbOfElements={sousActions.length}
            maxElementsPerPage={LIMIT}
            onChange={setCurrentPage}
          />
        )}
      </div>
    </Module>
  );
};
