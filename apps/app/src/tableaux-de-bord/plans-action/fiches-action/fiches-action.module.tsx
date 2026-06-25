import { FichesListTable } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.table/fiches-list.table';
import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import Module from '@/app/tableaux-de-bord/modules/module/module';
import PictoExpert from '@/app/ui/pictogrammes/PictoExpert';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ModuleFicheActionsSelect } from '@tet/api/plan-actions';
import { ButtonProps, MenuAction, Pagination } from '@tet/ui';
import { useState } from 'react';

type Props = {
  module: ModuleFicheActionsSelect;
  /** Actions disponnible dans le menu en haut à droite du module */
  menuActions?: MenuAction[];
  /** Bouton à afficher dans l'état vide */
  emptyButtons?: ButtonProps[];
};

/** Module pour afficher des indicateurs en fonctions de filtres spécifiques */
export const FichesActionModule = ({
  module,
  menuActions,
  emptyButtons,
}: Props) => {
  const collectivite = useCurrentCollectivite();

  const getSort = () => {
    if (module.defaultKey === 'actions-dont-je-suis-pilote') {
      return [{ field: 'titre' as const, direction: 'asc' as const }];
    }
    return [{ field: 'modified_at' as const, direction: 'desc' as const }];
  };

  const [currentPage, setCurrentPage] = useState(1);

  const { fiches, count, isLoading } = useListFiches(
    collectivite.collectiviteId,
    {
      filters: module.options.filtre,
      queryOptions: {
        sort: getSort(),
        limit: module.options.limit,
        page: currentPage,
      },
    }
  );

  return (
    <Module
      title={module.titre}
      filters={module.options.filtre}
      menuActions={menuActions}
      symbole={<PictoExpert className="w-16 h-16" />}
      isLoading={isLoading}
      isEmpty={count === 0}
      emptyButtons={emptyButtons}
    >
      <FichesListTable
        collectivite={collectivite}
        fiches={fiches}
        isLoading={isLoading}
        isGroupedActionsOn={false}
        enableSelection={false}
      />
      {count > module.options.limit && (
        <Pagination
          className="mx-auto mt-6"
          selectedPage={currentPage}
          nbOfElements={count}
          maxElementsPerPage={module.options.limit}
          onChange={setCurrentPage}
        />
      )}
    </Module>
  );
};
