import { cn } from '@tet/ui';
import { JSX, ReactNode } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { formatVariation } from './variation';
import { CellKey } from '../types';

export const variationHintId = (
  cellId: CellKey,
  variationToReferenceYear: number | null
): string | undefined =>
  variationToReferenceYear === null ? undefined : `${cellId}-variation`;

const VariationHint = ({
  id,
  ratio,
}: {
  id?: string;
  ratio: number;
}): JSX.Element => {
  const label = formatVariation(ratio);
  return (
    <span className="pointer-events-none shrink-0 text-[0.625rem] font-normal text-grey-5">
      <span aria-hidden>{`(${label})`}</span>
      <span id={id} className="sr-only">
        {appLabels.indicateurVariationReference(label)}
      </span>
    </span>
  );
};

export const ValueWithVariation = ({
  variationToReferenceYear,
  hintId,
  className,
  children,
}: {
  variationToReferenceYear: number | null;
  hintId?: string;
  className?: string;
  children: ReactNode;
}): JSX.Element => (
  <span className={cn('flex items-baseline gap-1', className)}>
    {variationToReferenceYear !== null && (
      <VariationHint id={hintId} ratio={variationToReferenceYear} />
    )}
    {children}
  </span>
);
