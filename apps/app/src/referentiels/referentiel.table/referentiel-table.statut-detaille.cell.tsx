import { CellContext } from '@tanstack/react-table';
import { StatutAvancementEnum } from '@tet/domain/referentiels';
import { cn, TableCell } from '@tet/ui';
import { useRef } from 'react';
import { OpenActionStatutDetailleModalButton } from '../actions/action-statut/open-action-statut-detaille-modal.button';
import { ActionListItem } from '../actions/use-list-actions';
import { getTableMeta } from './utils';

type Props = {
  cell: CellContext<ActionListItem, unknown>;
};

export const ReferentielTableStatutDetailleCell = ({ cell }: Props) => {
  const statut =
    cell.row.original.score.statut ?? StatutAvancementEnum.NON_RENSEIGNE;

  const hasStatutDetaille =
    statut === StatutAvancementEnum.DETAILLE_AU_POURCENTAGE;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const cellId = cell.cell.id;

  const {
    permissions: { canMutateReferentiel },
  } = getTableMeta(cell.table);

  if (!hasStatutDetaille || !canMutateReferentiel) {
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
        action={cell.row.original}
        statut={statut}
      />
    </TableCell>
  );
};
