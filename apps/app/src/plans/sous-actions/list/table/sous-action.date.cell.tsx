import { format, isEqual, isValid } from 'date-fns';
import { useState } from 'react';

import { FicheWithRelations, isFicheOnTime } from '@tet/domain/plans';
import { cn, Icon, Input, TableCell } from '@tet/ui';
import { useCanEditSousAction } from '../../data/use-can-edit-sous-action';
import { useUpdateSousAction } from '../../data/use-update-sous-action';

type Props = {
  sousAction: FicheWithRelations;
};

export const SousActionDateCell = ({ sousAction }: Props) => {
  const canUpdate = useCanEditSousAction(sousAction);

  const initialDate = sousAction.dateFin ?? '';

  const [value, setValue] = useState(initialDate);

  const { mutate: updateSousAction } = useUpdateSousAction();

  const isValidDate = isValid(new Date(value));

  const hasChanged = !isEqual(new Date(value), new Date(initialDate));

  const isLate = !isFicheOnTime({
    dateFin: sousAction.dateFin,
    statut: sousAction.statut,
  });

  return (
    <TableCell
      canEdit={canUpdate}
      edit={{
        onClose: () => {
          if (hasChanged)
            updateSousAction({
              ficheId: sousAction.id,
              ficheFields: {
                dateFin: isValidDate ? value : null,
              },
            });
        },
        renderOnEdit: () => (
          <Input
            containerClassname="grow border-none"
            className="w-40 border-grey-3 p-1"
            type="date"
            min="1900-01-01"
            max="2100-01-01"
            autoFocus
            value={value && format(new Date(value), 'yyyy-MM-dd')}
            onChange={(e) => setValue(e.target.value)}
          />
        ),
      }}
    >
      {sousAction.dateFin ? (
        <span
          className={cn('flex items-baseline gap-2 text-primary-9', {
            'text-error-1': isLate,
          })}
        >
          <Icon icon="calendar-line" size="sm" />
          {format(new Date(sousAction.dateFin), 'dd/MM/yyyy')}
        </span>
      ) : (
        <div className="text-center text-grey-6">{canUpdate ? '–' : ''}</div>
      )}
    </TableCell>
  );
};
