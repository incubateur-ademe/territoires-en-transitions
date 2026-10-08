import { cn, TableHeaderCell } from '@tet/ui';
import type { ReactNode } from 'react';

type Props = {
  label: ReactNode;
  colSpan?: number;
  className?: string;
  children?: ReactNode;
};

export const IndicateurValeurPeriodeHeaderCell = ({
  label,
  colSpan = 1,
  className,
  children,
}: Props) => (
  <TableHeaderCell
    colSpan={colSpan}
    scope="col"
    align="center"
    className={cn(
      'sticky top-0 z-[2] align-middle border-r border-grey-3 bg-white text-base font-bold',
      colSpan === 2 ? 'w-60 min-w-48' : 'w-32 min-w-24',
      className
    )}
  >
    <div className="flex items-center gap-1 justify-center align-middle">
      {label}
      {children}
    </div>
  </TableHeaderCell>
);
