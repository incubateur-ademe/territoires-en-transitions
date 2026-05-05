import { ActionPilotesGenericCell } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.table/generic-cells/action.pilotes.generic-cell';
import { FicheWithRelations } from '@tet/domain/plans';
import { useCanEditSousAction } from '../../data/use-can-edit-sous-action';
import { useUpdateSousAction } from '../../data/use-update-sous-action';

type Props = {
  sousAction: FicheWithRelations;
};

export const SousActionPilotesCell = ({ sousAction }: Props) => {
  const canUpdate = useCanEditSousAction(sousAction);

  const { mutate: updateSousAction } = useUpdateSousAction();

  return (
    <ActionPilotesGenericCell
      action={sousAction}
      canUpdate={canUpdate}
      updateAction={updateSousAction}
    />
  );
};
