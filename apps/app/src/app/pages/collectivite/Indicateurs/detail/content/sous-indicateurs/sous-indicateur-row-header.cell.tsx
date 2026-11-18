'use client';

import { STICKY_LEFT_SHADOW_CLASSNAME } from '@/app/indicateurs/valeurs/grid/scroll-shadow';
import { cn, TableHeaderCell } from '@tet/ui';
import type { JSX, PropsWithChildren, ReactNode } from 'react';

type Props = PropsWithChildren<{
  color: string;
  indentationRem?: number;
  isBold?: boolean;
  toggle?: ReactNode;
}>;

const SeriesSwatch = ({ color }: { color: string }): JSX.Element => (
  <span
    aria-hidden
    className="h-1 w-5 shrink-0 rounded-sm"
    style={{ backgroundColor: color }}
  />
);

export const SousIndicateurRowHeaderCell = ({
  color,
  indentationRem = 0,
  isBold = false,
  toggle = null,
  children,
}: Props): JSX.Element => (
  <TableHeaderCell
    scope="row"
    pinnedLeft
    className={cn(
      'border-b border-grey-3 align-middle',
      isBold && 'font-bold',
      STICKY_LEFT_SHADOW_CLASSNAME
    )}
  >
    <div
      className="flex w-full items-center justify-between gap-2"
      style={{ paddingLeft: `${indentationRem}rem` }}
    >
      <div className="flex items-center gap-2">
        <SeriesSwatch color={color} />
        <div>{children}</div>
      </div>
      {toggle}
    </div>
  </TableHeaderCell>
);
