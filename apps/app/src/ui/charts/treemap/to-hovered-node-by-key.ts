import type { TreemapGroup, TreemapTile } from './treemap-group';

type HoveredNode<TIntensity extends string, TGroupId extends string = string> =
  | { kind: 'group'; group: TreemapGroup<TIntensity, TGroupId> }
  | {
      kind: 'tile';
      group: TreemapGroup<TIntensity, TGroupId>;
      tile: TreemapTile<TIntensity>;
    };

const toGroupKey = <TIntensity extends string, TGroupId extends string>(
  group: TreemapGroup<TIntensity, TGroupId>
): string => JSON.stringify(['group', group.id]);

const toTileKey = <TIntensity extends string, TGroupId extends string>({
  group,
  tile,
}: {
  group: TreemapGroup<TIntensity, TGroupId>;
  tile: TreemapTile<TIntensity>;
}): string => JSON.stringify(['tile', group.id, tile.id]);

type HoveredNodeEntry<
  TIntensity extends string,
  TGroupId extends string
> = readonly [key: string, node: HoveredNode<TIntensity, TGroupId>];

const toGroupEntries = <TIntensity extends string, TGroupId extends string>(
  group: TreemapGroup<TIntensity, TGroupId>
): HoveredNodeEntry<TIntensity, TGroupId>[] => [
  [toGroupKey(group), { kind: 'group', group }],
  ...group.tiles.map(
    (tile): HoveredNodeEntry<TIntensity, TGroupId> => [
      toTileKey({ group, tile }),
      { kind: 'tile', group, tile },
    ]
  ),
];

const toHoveredNodeByKey = <TIntensity extends string, TGroupId extends string>(
  data: readonly TreemapGroup<TIntensity, TGroupId>[]
): ReadonlyMap<string, HoveredNode<TIntensity, TGroupId>> =>
  new Map(data.flatMap(toGroupEntries));

export { toGroupKey, toHoveredNodeByKey, toTileKey };
export type { HoveredNode };
