import { ActionDateGenericCell } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.table/generic-cells/action.date.generic-cell';
import { FicheWithRelations } from '@tet/domain/plans';
import { useCanEditSousAction } from '../../data/use-can-edit-sous-action';
import { useUpdateSousAction } from '../../data/use-update-sous-action';

type Props = {
  sousAction: FicheWithRelations;
};

export const SousActionDateCell = ({ sousAction }: Props) => {
  const canUpdate = useCanEditSousAction(sousAction);

  const { mutate: updateSousAction } = useUpdateSousAction();

  return (
    <ActionDateGenericCell
      action={sousAction}
      canUpdate={canUpdate}
      updateAction={updateSousAction}
    />
  );
};
