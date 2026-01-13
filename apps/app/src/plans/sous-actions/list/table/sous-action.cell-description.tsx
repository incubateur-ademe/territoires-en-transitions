import { useState } from 'react';

import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import { FicheWithRelations } from '@tet/domain/plans';
import { cn, TableCell, TableCellTextarea } from '@tet/ui';
import { isEqual } from 'es-toolkit';

const getTitle = (
  description: FicheWithRelations['description'],
  altText: string
) => {
  if (description && description.trim().length > 0) {
    return description;
  }
  return altText;
};

type Props = {
  sousAction: FicheWithRelations;
};

export const SousActionCellDescription = ({ sousAction }: Props) => {
  const [value, setValue] = useState(sousAction.description);

  const isEmpty = !value || value.trim().length === 0;

  const hasChanged = !isEqual(value, sousAction.description);

  const { mutate: updateFiche } = useUpdateFiche();

  return (
    <TableCell
      className="align-top"
      canEdit
      edit={{
        onClose: () =>
          hasChanged &&
          updateFiche({
            ficheId: sousAction.id,
            ficheFields: { description: value?.trim() },
          }),
        renderOnEdit: ({ openState }) => (
          <TableCellTextarea
            value={value ?? undefined}
            onChange={(e) => setValue(e.target.value)}
            closeEditing={() => openState.setIsOpen(false)}
            className="text-primary-9"
            placeholder="Saisir une description"
          />
        ),
      }}
    >
      <span
        className={cn('line-clamp-3 text-primary-9', {
          'text-grey-6': isEmpty,
        })}
        title={getTitle(value, 'Sans description')}
      >
        {getTitle(value, 'Saisir une description')}
      </span>
    </TableCell>
  );
};
