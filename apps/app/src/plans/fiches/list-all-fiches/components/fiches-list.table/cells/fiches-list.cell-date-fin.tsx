import { Fiche, isFicheOnTime } from '@/domain/plans';
import { cn, Icon } from '@/ui';
import { format } from 'date-fns';

export const FichesListCellDateFin = ({
  dateFin,
  statut,
}: Pick<Fiche, 'statut' | 'dateFin'>) => {
  if (!dateFin) return null;

  const isLate = !isFicheOnTime({ dateFin, statut });

  return (
    <span
      className={cn('flex items-baseline gap-2 text-grey-8', {
        'text-error-1': isLate,
      })}
    >
      <Icon icon="calendar-line" size="sm" />
      {format(new Date(dateFin), 'dd/MM/yyyy')}
    </span>
  );
};
