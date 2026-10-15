import type { JSX } from 'react';
import { ChartTooltip } from '../chart-tooltip';
import { TooltipHint } from '../tooltip-hint';
import type { StatusBar } from './status-bar';

const StatusBarTooltip = <TStatus extends string>({
  bar,
  formatValue,
  hint,
}: {
  bar: StatusBar<TStatus>;
  formatValue: (value: number) => string;
  hint?: string;
}): JSX.Element => {
  if (bar.tooltip !== undefined) {
    return <ChartTooltip {...bar.tooltip} hint={bar.tooltip.hint ?? hint} />;
  }
  return (
    <div className="flex max-w-64 flex-col items-start gap-1 whitespace-normal font-sans">
      <p className="m-0 text-sm font-bold text-primary-9">{bar.label}</p>
      <p className="m-0 text-xs font-normal leading-5 text-grey-8">
        {[bar.status, formatValue(bar.displayedValue ?? bar.value)].join(' · ')}
      </p>
      {hint !== undefined && <TooltipHint hint={hint} />}
    </div>
  );
};

export { StatusBarTooltip };
