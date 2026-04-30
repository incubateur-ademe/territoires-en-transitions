import { CellContext, Row } from '@tanstack/react-table';
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
import { getTableMeta, ReferentielTableMeta } from './utils';

type Props = {
  info: CellContext<ActionListItem, StatutAvancement | null | undefined>;
};

export const actionTypesWithStatut = new Set<ActionType>([
  ActionTypeEnum.SOUS_ACTION,
  ActionTypeEnum.TACHE,
]);

export const ReferentielTableStatutCell = ({ info }: Props) => {
  const action = info.row.original;
  const cellId = info.cell.id;

  const {
    permissions: { canMutateReferentiel },
    updateActionStatut,
    setFocusedCellId,
    isPendingDetailleALaTache,
    setPendingDetailleALaTache,
  } = getTableMeta(info.table);

  const {
    actionType,
    score: { statut },
  } = action;
  const displayedStatut =
    isPendingDetailleALaTache(action.actionId) &&
    (statut === null || statut === StatutAvancementEnum.NON_RENSEIGNE)
      ? StatutAvancementEnum.DETAILLE_A_LA_TACHE
      : statut;

  if (
    !actionTypesWithStatut.has(actionType) ||
    statut === StatutAvancementEnum.NON_RENSEIGNABLE
  ) {
    return <TableCell tabIndex={-1} data-cell-id={cellId} />;
  }

  return (
    <TableCell
      className="text-center"
      tabIndex={-1}
      data-cell-id={cellId}
      canEdit={canMutateReferentiel}
      edit={{
        renderOnEdit: ({ openState }) => {
          return (
            <InlineEditActionStatutDropdown
              action={action}
              statut={displayedStatut}
              updateActionStatut={updateActionStatut}
              inlineEditOpenState={openState}
              row={info.row}
              setFocusedCellId={setFocusedCellId}
              setPendingDetailleALaTache={setPendingDetailleALaTache}
            />
          );
        },
      }}
    >
      <ActionStatutBadge
        statut={displayedStatut ?? StatutAvancementEnum.NON_RENSEIGNE}
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
  row,
  setFocusedCellId,
  setPendingDetailleALaTache,
}: {
  action: ActionListItem;
  statut: StatutAvancement | null | undefined;
  updateActionStatut: ReturnType<typeof useUpdateActionStatut>['mutate'];
  inlineEditOpenState: OpenState;
  row: Row<ActionListItem>;
  setFocusedCellId: ReferentielTableMeta['setFocusedCellId'];
  setPendingDetailleALaTache: ReferentielTableMeta['setPendingDetailleALaTache'];
}) {
  const selectedStatutRef = useRef<StatutAvancement | null | undefined>(null);

  const closeEditing = () => {
    setIsOpen(false);
  };

  const expandAndFocusFirstChildStatut = () => {
    const firstChildStatutCellId = row.subRows[0]
      ?.getVisibleCells()
      .find((cell) => cell.column.id === 'statut')?.id;

    if (firstChildStatutCellId) {
      setFocusedCellId(firstChildStatutCellId);
    }

    if (!row.getIsExpanded()) {
      row.toggleExpanded(true);
    }
  };

  const handleOnStatutChange = (nextStatut: StatutAvancementCreate) => {
    selectedStatutRef.current = nextStatut;

    if (nextStatut === StatutAvancementEnum.DETAILLE_A_LA_TACHE) {
      setPendingDetailleALaTache(action.actionId, true);
      updateActionStatut({
        actionId: action.actionId,
        statut: nextStatut,
      });

      closeEditing();
      expandAndFocusFirstChildStatut();
      return;
    }

    if (isActionStatutDetaille(nextStatut)) {
      return;
    }

    setPendingDetailleALaTache(action.actionId, false);
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

    if (
      !isActionStatutDetaille(selectedStatutRef.current) ||
      selectedStatutRef.current === StatutAvancementEnum.DETAILLE_A_LA_TACHE
    ) {
      setIsOpen(false);
    }
  };

  return (
    <ActionStatutDropdown
      buttonClassName="border-none outline-none"
      inlineEdit={true}
      action={action}
      value={statut}
      openState={{ isOpen, setIsOpen: handleOnSelectOpenChange }}
      onChange={handleOnStatutChange}
      onStatutDetailleModalClose={closeEditing}
      inlineDetailleALaTache
    />
  );
}
