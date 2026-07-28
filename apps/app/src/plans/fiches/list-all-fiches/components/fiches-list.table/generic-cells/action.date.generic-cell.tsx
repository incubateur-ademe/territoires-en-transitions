import { appLabels } from '@/app/labels/catalog';
import { format, isEqual, isValid } from 'date-fns';
import { useState } from 'react';

import { isFicheOnTime } from '@tet/domain/plans';
import { cn, Icon, Input, TableCell } from '@tet/ui';
import { ActionGenericCellProps } from './types';

/** Generic cell for the date of a fiche */
export const ActionDateGenericCell = ({
  action,
  canUpdate,
  updateAction,
}: ActionGenericCellProps) => {
  // Une action qui se répète tous les ans n'a pas de date de fin : c'est la
  // même règle que dans le détail de la fiche action (cf. `planning/index.tsx`).
  const isAmeliorationContinue = action.ameliorationContinue === true;
  const displayDateFin = isAmeliorationContinue ? null : action.dateFin;

  const initialDate = displayDateFin ?? '';

  const [value, setValue] = useState(initialDate);

  const isValidDate = isValid(new Date(value));

  const hasChanged =
    value !== initialDate && !isEqual(new Date(value), new Date(initialDate));

  const isLate = !isFicheOnTime({
    dateFin: displayDateFin,
    statut: action.statut,
  });

  return (
    <TableCell
      canEdit={canUpdate && !isAmeliorationContinue}
      edit={{
        onClose: () => {
          if (hasChanged)
            updateAction({
              ficheId: action.id,
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
      {isAmeliorationContinue ? (
        <span className="flex items-baseline gap-2 text-grey-6">
          <Icon icon="loop-left-line" size="sm" />
          {appLabels.actionRepeteTousLesAns}
        </span>
      ) : displayDateFin ? (
        <span
          className={cn('flex items-baseline gap-2 text-primary-9', {
            'text-error-1': isLate,
          })}
        >
          <Icon icon="calendar-line" size="sm" />
          {format(new Date(displayDateFin), 'dd/MM/yyyy')}
        </span>
      ) : (
        <div className="text-center text-grey-6">
          {canUpdate ? 'Sélectionner' : ''}
        </div>
      )}
    </TableCell>
  );
};
