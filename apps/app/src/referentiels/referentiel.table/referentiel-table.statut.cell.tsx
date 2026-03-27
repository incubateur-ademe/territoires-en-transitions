import { CellContext } from '@tanstack/react-table';
import {
  StatutAvancementCreate,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { TableCell } from '@tet/ui';
import ActionStatutBadge from '../actions/action-statut/action-statut.badge';
import { ChooseActionStatutSelect } from '../actions/action-statut/choose-action-statut.select';
import { useUpdateActionStatut } from '../actions/action-statut/use-update-action-statut';
import { ActionListItem } from '../actions/use-list-actions';

type Props = {
  info: CellContext<ActionListItem, StatutAvancementCreate | undefined>;
  updateActionStatut: ReturnType<typeof useUpdateActionStatut>['mutate'];
};

export const ReferentielTableStatutCell = ({
  info,
  updateActionStatut,
}: Props) => {
  const action = info.row.original;
  const { statut } = action.score;

  if (statut === StatutAvancementEnum.NON_RENSEIGNABLE) {
    return <TableCell />;
  }

  return (
    <TableCell
      canEdit={true}
      edit={{
        renderOnEdit: ({ openState }) => {
          return (
            <ChooseActionStatutSelect
              openState={openState}
              value={statut}
              onChange={(value) =>
                updateActionStatut({ actionId: action.actionId, statut: value })
              }
              badgeSize="xs"
            />
          );
        },
      }}
    >
      <ActionStatutBadge
        statut={statut ?? StatutAvancementEnum.NON_RENSEIGNE}
        size="xs"
        className="m-auto"
      />
    </TableCell>
  );
};
