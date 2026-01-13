import { FicheWithRelations } from '@tet/domain/plans';
import { Button, TableCell } from '@tet/ui';
import { useState } from 'react';
import { SousActionDeleteModal } from '../../sous-action.delete-modal';

type Props = {
  sousAction: FicheWithRelations;
};

export const SousActionCellActions = ({ sousAction }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TableCell className="py-0">
      <Button
        icon="delete-bin-line"
        variant="white"
        size="xs"
        className="text-grey-6"
        onClick={() => setIsOpen(true)}
        title="Supprimer la sous-action"
      />
      <SousActionDeleteModal
        id={sousAction.id}
        openState={{ isOpen, setIsOpen }}
      />
    </TableCell>
  );
};
