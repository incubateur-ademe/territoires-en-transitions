import { Badge } from '@tet/ui';
import { sumBy } from 'es-toolkit';
import type { JSX } from 'react';
import { match } from 'ts-pattern';
import type { HoveredNode } from './to-hovered-node-by-key';
import type { IntensityVariant } from './treemap-group';

type TreemapTooltipProps<TIntensity extends string, TGroupId extends string> = {
  hovered: HoveredNode<TIntensity, TGroupId>;
  formatValue: (value: number) => string;
  toIntensityLabel: (intensity: TIntensity) => string;
  toIntensityVariant: (intensity: TIntensity) => IntensityVariant;
  hint?: string;
};

const TooltipHint = ({ hint }: { hint: string }): JSX.Element => (
  <Badge
    title={hint}
    variant="info"
    type="outlined"
    size="sm"
    icon="information-fill"
    iconPosition="left"
    uppercase={false}
    trim={false}
    className="mt-1"
  />
);

const TreemapTooltip = <TIntensity extends string, TGroupId extends string>({
  hovered,
  formatValue,
  toIntensityLabel,
  toIntensityVariant,
  hint,
}: TreemapTooltipProps<TIntensity, TGroupId>): JSX.Element => (
  <div className="flex max-w-64 flex-col items-start gap-1 whitespace-normal font-sans">
    {match(hovered)
      .with({ kind: 'group' }, ({ group }) => (
        <>
          <p className="m-0 text-sm font-bold text-primary-9">{group.label}</p>
          <p className="m-0 text-xs font-normal leading-5 text-grey-8">
            {formatValue(sumBy(group.tiles, (tile) => tile.value))}
          </p>
        </>
      ))
      .with({ kind: 'tile' }, ({ group, tile }) => (
        <>
          <p className="m-0 text-sm font-bold text-primary-9">{group.label}</p>
          <p className="m-0 text-xs font-normal text-grey-8">{tile.label}</p>
          <p className="m-0 text-xs font-normal leading-5 text-grey-8">
            {formatValue(tile.value)}
          </p>
          <Badge
            title={toIntensityLabel(tile.intensity)}
            variant={toIntensityVariant(tile.intensity)}
            type="outlined"
            size="xs"
          />
        </>
      ))
      .exhaustive()}
    {hint !== undefined && <TooltipHint hint={hint} />}
  </div>
);

export { TreemapTooltip };
