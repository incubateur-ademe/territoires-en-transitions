import { Cell } from '@tanstack/react-table';
import { StatutAvancementEnum } from '@tet/domain/referentiels';
import { cn, TableCell } from '@tet/ui';
import { useRef } from 'react';
import { OpenActionStatutDetailleModalButton } from '../actions/action-statut/open-action-statut-detaille-modal.button';
import { ActionListItem } from '../actions/use-list-actions';

type Props = {
  row: ActionListItem;
  cell: Cell<ActionListItem, unknown>;
};

export const ReferentielTableStatutDetailleCell = ({ row, cell }: Props) => {
  const statut = row.score.statut ?? StatutAvancementEnum.NON_RENSEIGNE;
  const hasStatutDetaille =
    statut === StatutAvancementEnum.DETAILLE_AU_POURCENTAGE ||
    statut === StatutAvancementEnum.DETAILLE_A_LA_TACHE;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const cellId = cell.id;

  if (!hasStatutDetaille) {
    return <TableCell tabIndex={-1} data-cell-id={cellId} />;
  }

  const openModal = () => {
    buttonRef.current?.click();
  };

  return (
    <TableCell
      tabIndex={-1}
      data-cell-id={cellId}
      className={cn('text-center cursor-pointer')}
      onClick={openModal}
      onKeyDownCapture={(event) => {
        if (event.key === 'Enter') {
          openModal();
        }
      }}
    >
      <OpenActionStatutDetailleModalButton
        ref={buttonRef}
        action={row}
        statut={statut}
      />
    </TableCell>
  );
};
