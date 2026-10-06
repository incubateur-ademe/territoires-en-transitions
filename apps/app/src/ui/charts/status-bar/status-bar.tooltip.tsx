import type { JSX } from 'react';
import type { StatusBar } from './status-bar';

const StatusBarTooltip = <TStatus extends string>({
  bar,
  formatValue,
}: {
  bar: StatusBar<TStatus>;
  formatValue: (value: number) => string;
}): JSX.Element => (
  <div className="flex max-w-64 flex-col gap-1 whitespace-normal font-sans">
    <p className="m-0 text-sm font-bold text-primary-9">{bar.label}</p>
    <p className="m-0 text-xs font-normal leading-5 text-grey-8">
      {[bar.status, formatValue(bar.value)].join(' · ')}
    </p>
  </div>
);

export { StatusBarTooltip };
