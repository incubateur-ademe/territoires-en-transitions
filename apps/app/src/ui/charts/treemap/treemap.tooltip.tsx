import { sumBy } from 'es-toolkit';
import type { JSX } from 'react';
import { match } from 'ts-pattern';
import type { HoveredNode } from './to-hovered-node-by-key';

const TreemapTooltip = <TIntensity extends string>({
  hovered,
  formatValue,
}: {
  hovered: HoveredNode<TIntensity>;
  formatValue: (value: number) => string;
}): JSX.Element => (
  <div className="flex max-w-64 flex-col gap-1 whitespace-normal font-sans">
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
          <p className="m-0 text-xs font-normal text-grey-8">{group.label}</p>
          <p className="m-0 text-sm font-bold text-primary-9">{tile.label}</p>
          <p className="m-0 text-xs font-normal leading-5 text-grey-8">
            {[tile.intensity, formatValue(tile.value)].join(' · ')}
          </p>
        </>
      ))
      .exhaustive()}
  </div>
);

export { TreemapTooltip };
