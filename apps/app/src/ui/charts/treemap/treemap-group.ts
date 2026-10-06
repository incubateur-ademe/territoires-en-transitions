import type { BadgeProps } from '@tet/ui';

type HexColor = `#${string}`;

type IntensityScale<TIntensity extends string> = readonly [
  TIntensity,
  ...TIntensity[]
];

type IntensityVariant = NonNullable<BadgeProps['variant']>;

type TreemapTile<TIntensity extends string> = {
  id: string;
  label: string;
  value: number;
  intensity: TIntensity;
};

type TreemapGroup<
  TIntensity extends string,
  TGroupId extends string = string
> = {
  id: TGroupId;
  label: string;
  color: HexColor;
  tiles: readonly TreemapTile<TIntensity>[];
};

export type {
  HexColor,
  IntensityScale,
  IntensityVariant,
  TreemapGroup,
  TreemapTile,
};
