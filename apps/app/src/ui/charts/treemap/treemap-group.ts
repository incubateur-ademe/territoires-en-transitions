import type { BadgeProps } from '@tet/ui';

type HexColor = `#${string}`;

type IntensityScale<TIntensity extends string> = readonly [
  TIntensity,
  ...TIntensity[]
];

type IntensityVariant = NonNullable<BadgeProps['variant']>;

type TreemapTile<TIntensity extends string, TTileId extends string = string> = {
  id: TTileId;
  label: string;
  value: number;
  intensity: TIntensity;
};

type TreemapGroup<
  TIntensity extends string,
  TGroupId extends string = string,
  TTileId extends string = string
> = {
  id: TGroupId;
  label: string;
  color: HexColor;
  tiles: readonly TreemapTile<TIntensity, TTileId>[];
};

export type {
  HexColor,
  IntensityScale,
  IntensityVariant,
  TreemapGroup,
  TreemapTile,
};
