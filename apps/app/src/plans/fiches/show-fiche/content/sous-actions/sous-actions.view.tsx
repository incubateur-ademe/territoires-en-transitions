import { useCreateSousAction } from '@/app/plans/sous-actions/data/use-create-sous-action';
import { SousActionTable } from '@/app/plans/sous-actions/list/table/sous-action.table';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import { useListFiches } from '../../../list-all-fiches/data/use-list-fiches';
import { useFicheContext } from '../../context/fiche-context';

export const SousActionsView = () => {
  const collectivite = useCurrentCollectivite();

  const { fiche } = useFicheContext();

  const { mutate: createSousAction, isPending: isLoadingCreate } =
    useCreateSousAction(fiche.id);

  const { fiches: sousActions, isLoading } = useListFiches(
    collectivite.collectiviteId,
    {
      filters: {
        parentsId: [fiche.id],
      },
      queryOptions: {
        sort: [{ field: 'created_at', direction: 'asc' }],
        limit: 'all',
      },
    }
  );

  const isEmpty = sousActions.length === 0;

  return (
    <div className="p-2 bg-white rounded-lg border border-grey-3 overflow-x-auto">
      <SousActionTable
        sousActions={sousActions}
        isLoading={isLoading}
        isEmpty={isEmpty}
        createSousAction={createSousAction}
        hiddenColumns={['parentId']}
        isReadOnly={collectivite.isReadOnly}
        isLoadingNewRow={isLoadingCreate}
      />
      {!isEmpty && !collectivite.isReadOnly && (
        <Button
          className="m-4"
          icon="add-line"
          size="xs"
          onClick={() => createSousAction()}
        >
          Ajouter une sous-action
        </Button>
      )}
    </div>
  );
};
