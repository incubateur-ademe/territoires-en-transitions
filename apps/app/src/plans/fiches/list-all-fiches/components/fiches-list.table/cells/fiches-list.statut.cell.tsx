import { ActionStatutGenericCell } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.table/generic-cells/action.statut.generic-cell';
import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import { FicheWithRelationsAndCollectivite } from '@tet/domain/plans';
import { useCanEditAction } from '../../../../share-fiche/use-can-edit-action';

type Props = {
  action: FicheWithRelationsAndCollectivite;
};

export const FichesListStatutCell = ({ action }: Props) => {
  const canUpdate = useCanEditAction(action);

  const { mutate: updateAction } = useUpdateFiche();

  return (
    <ActionStatutGenericCell
      action={action}
      canUpdate={canUpdate}
      updateAction={updateAction}
    />
  );
};
