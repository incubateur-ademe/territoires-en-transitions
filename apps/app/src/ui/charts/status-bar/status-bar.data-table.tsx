import {
  Icon,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tet/ui';
import type { JSX } from 'react';
import type { StatusBar } from './status-bar';

type StatusBarDataTableLabels = {
  toggle: string;
  barHeader: string;
  valueHeader: string;
  statusHeader: string;
};

type StatusBarDataTableProps<TStatus extends string> = {
  data: readonly StatusBar<TStatus>[];
  formatValue: (value: number) => string;
  labels: StatusBarDataTableLabels;
};

const StatusBarDataTable = <TStatus extends string>({
  data,
  formatValue,
  labels,
}: StatusBarDataTableProps<TStatus>): JSX.Element => (
  <details className="group">
    <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-xs font-normal text-primary-8 marker:hidden">
      <Icon
        icon="arrow-right-s-line"
        size="sm"
        className="transition-transform group-open:rotate-90"
        aria-hidden
      />
      {labels.toggle}
    </summary>
    <Table className="mt-3 text-sm">
      <TableHead>
        <TableRow>
          <TableHeaderCell title={labels.barHeader} />
          <TableHeaderCell title={labels.valueHeader} align="right" />
          <TableHeaderCell title={labels.statusHeader} align="right" />
        </TableRow>
      </TableHead>
      <tbody>
        {data.map((bar) => (
          <TableRow key={bar.id}>
            <TableCell>{bar.label}</TableCell>
            <TableCell className="text-right">
              {formatValue(bar.value)}
            </TableCell>
            <TableCell className="text-right">{bar.status}</TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  </details>
);

export { StatusBarDataTable };
