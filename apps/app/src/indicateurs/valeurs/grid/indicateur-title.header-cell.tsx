import { cn, TableHeaderCell, VisibleWhen } from '@tet/ui';
import { JSX } from 'react';
import { STICKY_LEFT_SHADOW_CLASSNAME } from './scroll-shadow';

type Props = {
  title: string;
  unit: string;
  pinnedLeft?: boolean;
  className?: string;
};

export const IndicateurHeaderTitleCell = ({
  title,
  unit,
  pinnedLeft = true,
  className,
}: Props): JSX.Element => (
  <TableHeaderCell
    pinnedLeft={pinnedLeft}
    className={cn(
      'w-80 min-w-64 align-middle',
      pinnedLeft && STICKY_LEFT_SHADOW_CLASSNAME,
      className
    )}
  >
    <div className="leading-normal text-base">
      <span className="font-bold text-primary-9">{title}</span>
      <VisibleWhen condition={unit !== null}>
        <span className="text-sm text-grey-8">{` (${unit})`}</span>
      </VisibleWhen>
    </div>
  </TableHeaderCell>
);
