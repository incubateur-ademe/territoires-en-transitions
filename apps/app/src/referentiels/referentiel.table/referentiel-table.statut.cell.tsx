import { CellContext } from '@tanstack/react-table';
import {
  ActionType,
  ActionTypeEnum,
  StatutAvancement,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { TableCell } from '@tet/ui';
import ActionStatutBadge from '../actions/action-statut/action-statut.badge';
import { ChooseActionStatutSelect } from '../actions/action-statut/choose-action-statut.select';
import { useUpdateActionStatut } from '../actions/action-statut/use-update-action-statut';
import { ActionListItem } from '../actions/use-list-actions';
import { useReferentielTableCellFocus } from './referentiel-table.keyboard';

type Props = {
  info: CellContext<ActionListItem, StatutAvancement | null | undefined>;
  updateActionStatut: ReturnType<typeof useUpdateActionStatut>['mutate'];
};

export const actionTypesWithStatut = new Set<ActionType>([
  ActionTypeEnum.SOUS_ACTION,
  ActionTypeEnum.TACHE,
]);

export const ReferentielTableStatutCell = ({
  info,
  updateActionStatut,
}: Props) => {
  const { referentielCellProps } = useReferentielTableCellFocus(info.cell);
  const action = info.row.original;

  const { actionType } = action;

  if (!actionTypesWithStatut.has(actionType)) {
    return <TableCell {...referentielCellProps} />;
  }

  const { statut } = action.score;

  if (statut === StatutAvancementEnum.NON_RENSEIGNABLE) {
    return <TableCell {...referentielCellProps} />;
  }

  return (
    <TableCell
      {...referentielCellProps}
      canEdit={true}
      edit={{
        renderOnEdit: ({ openState }) => {
          return (
            <ChooseActionStatutSelect
              openState={openState}
              value={statut}
              badgeSize="xs"
              onChange={(value) =>
                updateActionStatut({ actionId: action.actionId, statut: value })
              }
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
