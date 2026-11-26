import { appLabels } from '@/app/labels/catalog';
import { isJaugeNonRenseignee, Statut } from '@tet/domain/plans';
import { cn } from '@tet/ui/utils/cn';
import { JSX } from 'react';

export const JaugeBadge = ({
  value,
  statut,
  jaugeModifiedAt,
  isDisabled = false,
  isLarge = false,
}: {
  value: number;
  statut?: Statut | null;
  jaugeModifiedAt?: string | null;
  isDisabled?: boolean;
  isLarge?: boolean;
}): JSX.Element => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center justify-center h-6 px-2 rounded whitespace-nowrap text-xs leading-4 font-bold border',
      isDisabled
        ? 'text-grey-8 bg-grey-2 border-grey-5'
        : 'text-primary-9 bg-primary-1 border-primary-4',
      { 'min-w-14': isLarge }
    )}
  >
    {statut !== undefined &&
    isJaugeNonRenseignee({ statut, jauge: value, jaugeModifiedAt })
      ? appLabels.ficheJaugeNonRenseignee
      : `${value} %`}
  </span>
);
