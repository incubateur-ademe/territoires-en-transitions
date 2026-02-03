import { useState } from 'react';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { cn, TableCell, TableCellTextarea } from '@tet/ui';
import { isEqual } from 'es-toolkit';
import { useUpdateSousAction } from '../../data/use-update-sous-action';

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

export const SousActionDescriptionCell = ({ sousAction }: Props) => {
  const { hasCollectivitePermission } = useCurrentCollectivite();

  const canMutate = hasCollectivitePermission('plans.fiches.update');

  const [value, setValue] = useState(sousAction.description);

  const isEmpty = !value || value.trim().length === 0;

  const hasChanged = !isEqual(value, sousAction.description);

  const { mutate: updateSousAction } = useUpdateSousAction();

  return (
    <TableCell
      className="align-top"
      canEdit={canMutate}
      edit={{
        onClose: () =>
          hasChanged &&
          updateSousAction({
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
        {getTitle(value, canMutate ? 'Saisir une description' : '')}
      </span>
    </TableCell>
  );
};
