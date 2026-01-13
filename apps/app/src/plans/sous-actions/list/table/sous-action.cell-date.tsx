import { format, isValid } from 'date-fns';
import { isEqual } from 'es-toolkit';
import { useRef, useState } from 'react';

import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import { FicheWithRelations, isFicheOnTime } from '@tet/domain/plans';
import { cn, Icon, Input, TableCell } from '@tet/ui';

type Props = {
  sousAction: FicheWithRelations;
};

export const SousActionCellDate = ({ sousAction }: Props) => {
  const initialDate = sousAction.dateFin ?? '';

  const [value, setValue] = useState(initialDate);

  const { mutate: updateFiche } = useUpdateFiche();

  const refDateFin = useRef<HTMLInputElement>(null);

  const isValidDate = isValid(new Date(value));

  const hasChanged = !isEqual(new Date(value), new Date(initialDate));

  const isLate = !isFicheOnTime({
    dateFin: sousAction.dateFin,
    statut: sousAction.statut,
  });

  return (
    <TableCell
      canEdit
      edit={{
        onClose: () =>
          hasChanged &&
          updateFiche({
            ficheId: sousAction.id,
            ficheFields: {
              dateFin: isValidDate ? value : null,
            },
          }),
        renderOnEdit: () => (
          <Input
            ref={refDateFin}
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
        <div className="text-center text-grey-6">-</div>
      )}
    </TableCell>
  );
};
