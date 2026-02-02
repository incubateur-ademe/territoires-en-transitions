import { format, isValid } from 'date-fns';
import { isEqual } from 'es-toolkit';
import { useState } from 'react';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { FicheWithRelations, isFicheOnTime } from '@tet/domain/plans';
import { cn, Icon, Input, TableCell } from '@tet/ui';
import { useUpdateSousAction } from '../../data/use-update-sous-action';

type Props = {
  sousAction: FicheWithRelations;
};

export const SousActionCellDate = ({ sousAction }: Props) => {
  const { hasCollectivitePermission } = useCurrentCollectivite();

  const canMutate = hasCollectivitePermission('plans.fiches.update');

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
      canEdit={canMutate}
      edit={{
        onClose: () => {
          hasChanged &&
            isValidDate &&
            updateSousAction({
              ficheId: sousAction.id,
              ficheFields: {
                dateFin: value,
              },
            });
        },
        renderOnEdit: () => (
          <Input
            containerClassname="grow border-none"
            className="w-40 border-grey-3 p-1"
            type="date"
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
        <div className="text-center text-grey-6">{canMutate ? '–' : ''}</div>
      )}
    </TableCell>
  );
};
