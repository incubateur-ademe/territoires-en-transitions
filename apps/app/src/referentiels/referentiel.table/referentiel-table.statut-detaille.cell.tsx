import { Cell } from '@tanstack/react-table';
import { StatutAvancementEnum } from '@tet/domain/referentiels';
import { cn, TableCell } from '@tet/ui';
import { useRef } from 'react';
import { OpenActionStatutDetailleModalButton } from '../actions/action-statut/open-action-statut-detaille-modal.button';
import { ActionListItem } from '../actions/use-list-actions';
import { useReferentielTableCellFocus } from './referentiel-table.keyboard';

type Props = {
  row: ActionListItem;
  cell: Cell<ActionListItem, unknown>;
};

export const ReferentielTableStatutDetailleCell = ({ row, cell }: Props) => {
  const statut = row.score.statut ?? StatutAvancementEnum.NON_RENSEIGNE;
  const hasStatutDetaille =
    statut === StatutAvancementEnum.DETAILLE_AU_POURCENTAGE ||
    statut === StatutAvancementEnum.DETAILLE_A_LA_TACHE;

  const { focusCellProps } = useReferentielTableCellFocus(cell);
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (!hasStatutDetaille) {
    return <TableCell {...focusCellProps} />;
  }

  const { className, ...otherFocusCellProps } = focusCellProps;

  const openModal = () => {
    buttonRef.current?.click();
  };

  return (
    <TableCell
      {...otherFocusCellProps}
      className={cn('text-center cursor-pointer', className)}
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
