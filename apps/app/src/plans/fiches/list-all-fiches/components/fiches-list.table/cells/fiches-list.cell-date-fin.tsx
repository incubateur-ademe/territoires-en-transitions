import { cn, Icon } from '@/ui';
import { format, isBefore, startOfToday } from 'date-fns';

type Props = {
  date?: string | null;
};

export const FichesListCellDateFin = ({ date }: Props) => {
  if (!date) return null;

  const isLate = isBefore(new Date(date), startOfToday());

  return (
    <span
      className={cn('flex items-baseline gap-2 text-grey-8', {
        'text-error-1': isLate,
      })}
    >
      <Icon icon="calendar-line" size="sm" />
      {format(new Date(date), 'dd/MM/yyyy')}
    </span>
  );
};
