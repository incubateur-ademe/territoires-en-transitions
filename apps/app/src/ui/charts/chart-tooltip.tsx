import { Badge } from '@tet/ui';
import type { JSX } from 'react';
import { TooltipHint } from './tooltip-hint';
import type { IntensityVariant } from './treemap/treemap-group';

type ChartTooltipBadge = {
  label: string;
  variant: IntensityVariant;
};

type ChartTooltipContent = {
  title: string;
  lines: readonly string[];
  badge?: ChartTooltipBadge;
  hint?: string;
};

const ChartTooltip = ({
  title,
  lines,
  badge,
  hint,
}: ChartTooltipContent): JSX.Element => (
  <div className="flex max-w-64 flex-col items-start gap-1 whitespace-normal font-sans">
    <p className="m-0 text-sm font-bold text-primary-9">{title}</p>
    {lines.map((line) => (
      <p key={line} className="m-0 text-xs font-normal leading-5 text-grey-8">
        {line}
      </p>
    ))}
    {badge !== undefined && (
      <Badge
        title={badge.label}
        variant={badge.variant}
        type="outlined"
        size="xs"
      />
    )}
    {hint !== undefined && <TooltipHint hint={hint} />}
  </div>
);

export type { ChartTooltipBadge, ChartTooltipContent };
export { ChartTooltip };
