import { CellContext } from '@tanstack/react-table';
import {
  ActionType,
  ActionTypeEnum,
  isActionStatutDetaille,
  StatutAvancement,
  StatutAvancementCreate,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { TableCell } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useRef } from 'react';
import ActionStatutBadge from '../actions/action-statut/action-statut.badge';
import { ActionStatutDropdown } from '../actions/action-statut/action-statut.dropdown';
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
  const { focusCellProps: referentielCellProps } = useReferentielTableCellFocus(
    info.cell
  );
  const action = info.row.original;

  const {
    actionType,
    score: { statut },
  } = action;

  if (
    !actionTypesWithStatut.has(actionType) ||
    statut === StatutAvancementEnum.NON_RENSEIGNABLE
  ) {
    return <TableCell {...referentielCellProps} />;
  }

  return (
    <TableCell
      {...referentielCellProps}
      canEdit={true}
      edit={{
        renderOnEdit: ({ openState }) => {
          return (
            <InlineEditActionStatutDropdown
              action={action}
              statut={statut}
              updateActionStatut={updateActionStatut}
              inlineEditOpenState={openState}
            />
          );
        },
      }}
    >
      <ActionStatutBadge
        statut={statut ?? StatutAvancementEnum.NON_RENSEIGNE}
        size="xs"
      />
    </TableCell>
  );
};

function InlineEditActionStatutDropdown({
  action,
  statut,
  updateActionStatut,
  inlineEditOpenState: { isOpen, setIsOpen },
}: {
  action: ActionListItem;
  statut: StatutAvancement | null | undefined;
  updateActionStatut: ReturnType<typeof useUpdateActionStatut>['mutate'];
  inlineEditOpenState: OpenState;
}) {
  // useRef pour garder la référence du statut sélectionné
  const selectedStatutRef = useRef<StatutAvancement | null | undefined>(null);

  const closeEditing = () => {
    setIsOpen(false);
  };

  const handleOnStatutChange = (nextStatut: StatutAvancementCreate) => {
    selectedStatutRef.current = nextStatut;

    if (isActionStatutDetaille(nextStatut)) {
      return;
    }

    updateActionStatut({
      actionId: action.actionId,
      statut: nextStatut,
    });

    closeEditing();
  };

  const handleOnSelectOpenChange = (opened: boolean) => {
    if (opened) {
      setIsOpen(true);
      return;
    }

    if (!isActionStatutDetaille(selectedStatutRef.current)) {
      setIsOpen(false);
    }
  };

  return (
    <ActionStatutDropdown
      buttonClassName="border-none outline-none"
      displayOptionsWithoutFloater={true}
      action={action}
      value={statut}
      openState={{ isOpen, setIsOpen: handleOnSelectOpenChange }}
      onChange={handleOnStatutChange}
      onStatutDetailleModalClose={closeEditing}
    />
  );
}
