'use client';

import { cn, TableHeaderCell } from '@tet/ui';
import type { JSX, PropsWithChildren, ReactNode } from 'react';

type Props = PropsWithChildren<{
  color: string;
  indentationRem?: number;
  isBold?: boolean;
  toggle?: ReactNode;
  actions?: ReactNode;
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
  actions = null,
  children,
}: Props): JSX.Element => (
  <TableHeaderCell
    scope="row"
    className={cn(
      'max-w-80 border-b border-r border-primary-4 align-middle',
      isBold && 'font-bold'
    )}
  >
    <div
      className="flex w-full items-center justify-between gap-2"
      style={{ paddingLeft: `${indentationRem}rem` }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {toggle !== null && (
          <span className="order-first flex w-6 shrink-0 justify-center">
            {toggle}
          </span>
        )}
        <SeriesSwatch color={color} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1">{actions}</div>
    </div>
  </TableHeaderCell>
);
