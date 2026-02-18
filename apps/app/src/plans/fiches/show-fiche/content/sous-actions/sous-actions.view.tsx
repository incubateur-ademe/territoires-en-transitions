import { useCreateSousAction } from '@/app/plans/sous-actions/data/use-create-sous-action';
import { SousActionTable } from '@/app/plans/sous-actions/list/table/sous-action.table';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import { useFicheContext } from '../../context/fiche-context';
import { ContentLayout } from '../content-layout';

export const SousActionsView = () => {
  const { hasCollectivitePermission } = useCurrentCollectivite();

  const { fiche, sousActions } = useFicheContext();

  const { mutate: createSousAction, isPending: isLoadingCreate } =
    useCreateSousAction(fiche.id);

  const isEmpty = sousActions.count === 0;

  const canMutate = hasCollectivitePermission('plans.fiches.update');
  const canCreate = hasCollectivitePermission('plans.fiches.create');

  return (
    <ContentLayout.Root>
      <ContentLayout.Content data={[]}>
        <div className="p-2 bg-white rounded-lg border border-grey-3">
          <SousActionTable
            sousActions={sousActions.list}
            isLoading={sousActions.isLoading}
            isEmpty={isEmpty}
            createSousAction={canCreate ? createSousAction : undefined}
            hiddenColumns={['parentId']}
            isReadOnly={!canMutate}
            isLoadingNewRow={isLoadingCreate}
          />
          {!isEmpty && canCreate && (
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
      </ContentLayout.Content>
    </ContentLayout.Root>
  );
};
