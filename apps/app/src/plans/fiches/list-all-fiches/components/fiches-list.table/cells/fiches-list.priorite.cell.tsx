import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import { FicheWithRelationsAndCollectivite } from '@tet/domain/plans';
import { ActionPrioriteGenericCell } from '../generic-cells/action.priorite.generic-cell';
import { useCanEditAction } from '../../../../share-fiche/use-can-edit-action';

type Props = {
  action: FicheWithRelationsAndCollectivite;
};

export const FichesListPrioriteCell = ({ action }: Props) => {
  const canUpdate = useCanEditAction(action);

  const { mutate: updateAction } = useUpdateFiche();

  return (
    <ActionPrioriteGenericCell
      action={action}
      canUpdate={canUpdate}
      updateAction={updateAction}
    />
  );
};
