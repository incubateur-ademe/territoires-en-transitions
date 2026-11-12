import { appLabels } from '@/app/labels/catalog';
import { Statut, StatutEnum } from '@tet/domain/plans';
import { cn } from '@tet/ui/utils/cn';
import { JSX } from 'react';

export const JaugeBadge = ({
  value,
  statut,
  isDisabled = false,
  isLarge = false,
}: {
  value: number;
  statut?: Statut | null;
  isDisabled?: boolean;
  isLarge?: boolean;
}): JSX.Element => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center justify-center h-6 px-2 rounded whitespace-nowrap text-xs leading-4 font-bold ring-1 ring-inset',
      isDisabled
        ? 'text-grey-8 bg-grey-2 ring-grey-5'
        : 'text-primary-9 bg-primary-1 ring-primary-4',
      { 'min-w-14': isLarge }
    )}
  >
    {statut !== undefined &&
    statut !== StatutEnum.A_VENIR &&
    statut !== StatutEnum.REALISE &&
    value === 0
      ? appLabels.ficheJaugeNonRenseignee
      : `${value} %`}
  </span>
);
