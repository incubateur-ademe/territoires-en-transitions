import type { TreemapGroup, TreemapTile } from './treemap-group';

type HoveredNode<TIntensity extends string> =
  | { kind: 'group'; group: TreemapGroup<TIntensity> }
  | {
      kind: 'tile';
      group: TreemapGroup<TIntensity>;
      tile: TreemapTile<TIntensity>;
    };

const toGroupKey = <TIntensity extends string>(
  group: TreemapGroup<TIntensity>
): string => JSON.stringify(['group', group.id]);

const toTileKey = <TIntensity extends string>({
  group,
  tile,
}: {
  group: TreemapGroup<TIntensity>;
  tile: TreemapTile<TIntensity>;
}): string => JSON.stringify(['tile', group.id, tile.id]);

type HoveredNodeEntry<TIntensity extends string> = readonly [
  key: string,
  node: HoveredNode<TIntensity>
];

const toGroupEntries = <TIntensity extends string>(
  group: TreemapGroup<TIntensity>
): HoveredNodeEntry<TIntensity>[] => [
  [toGroupKey(group), { kind: 'group', group }],
  ...group.tiles.map(
    (tile): HoveredNodeEntry<TIntensity> => [
      toTileKey({ group, tile }),
      { kind: 'tile', group, tile },
    ]
  ),
];

const toHoveredNodeByKey = <TIntensity extends string>(
  data: readonly TreemapGroup<TIntensity>[]
): ReadonlyMap<string, HoveredNode<TIntensity>> =>
  new Map(data.flatMap(toGroupEntries));

export { toGroupKey, toHoveredNodeByKey, toTileKey };
export type { HoveredNode };
