import { useState } from 'react';

import { generateTitle } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { cn, TableCell, TableCellTextarea } from '@tet/ui';
import { isEqual } from 'es-toolkit';
import { useUpdateSousAction } from '../../data/use-update-sous-action';

type Props = {
  sousAction: FicheWithRelations;
};

export const SousActionCellTitle = ({ sousAction }: Props) => {
  const { isReadOnly } = useCurrentCollectivite();

  const [value, setValue] = useState(sousAction.titre);

  const isEmpty = !value || value.trim().length === 0;

  const hasChanged = !isEqual(value, sousAction.titre);

  const { mutate: updateSousAction } = useUpdateSousAction();

  return (
    <TableCell
      className="align-top"
      canEdit={!isReadOnly}
      edit={{
        onClose: () =>
          hasChanged &&
          updateSousAction({
            ficheId: sousAction.id,
            ficheFields: { titre: value?.trim() },
          }),
        renderOnEdit: ({ openState }) => (
          <TableCellTextarea
            value={value ?? undefined}
            onChange={(e) => setValue(e.target.value)}
            closeEditing={() => openState.setIsOpen(false)}
            className="font-medium text-primary-9"
            placeholder="Saisir un titre"
          />
        ),
      }}
    >
      <span
        className={cn('line-clamp-3 font-medium text-primary-9', {
          'text-grey-6': isEmpty,
        })}
        title={generateTitle(value)}
      >
        {generateTitle(value)}
      </span>
    </TableCell>
  );
};
