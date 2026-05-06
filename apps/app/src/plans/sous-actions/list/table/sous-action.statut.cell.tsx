import { ActionStatutGenericCell } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.table/generic-cells/action.statut.generic-cell';
import { FicheWithRelations } from '@tet/domain/plans';
import { useCanEditSousAction } from '../../data/use-can-edit-sous-action';
import { useUpdateSousAction } from '../../data/use-update-sous-action';

type Props = {
  sousAction: FicheWithRelations;
};

export const SousActionStatutCell = ({ sousAction }: Props) => {
  const canUpdate = useCanEditSousAction(sousAction);

  const { mutate: updateSousAction } = useUpdateSousAction();

  return (
    <ActionStatutGenericCell
      action={sousAction}
      canUpdate={canUpdate}
      updateAction={updateSousAction}
    />
  );
};
