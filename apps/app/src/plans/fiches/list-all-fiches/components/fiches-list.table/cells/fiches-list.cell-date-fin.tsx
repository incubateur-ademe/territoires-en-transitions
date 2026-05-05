import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import { FicheWithRelationsAndCollectivite } from '@tet/domain/plans';
import { useCanEditAction } from '../../../../share-fiche/use-can-edit-action';
import { ActionDateGenericCell } from '../generic-cells/action.date.generic-cell';

type Props = {
  action: FicheWithRelationsAndCollectivite;
};

export const FichesListCellDateFin = ({ action }: Props) => {
  const canUpdate = useCanEditAction(action);

  const { mutate: updateFiche } = useUpdateFiche();

  return (
    <ActionDateGenericCell
      action={action}
      canUpdate={canUpdate}
      updateAction={updateFiche}
    />
  );
};
