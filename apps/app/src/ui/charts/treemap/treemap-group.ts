type HexColor = `#${string}`;

type IntensityScale<TIntensity extends string> = readonly [
  TIntensity,
  ...TIntensity[]
];

type TreemapTile<TIntensity extends string> = {
  id: string;
  label: string;
  value: number;
  intensity: TIntensity;
};

type TreemapGroup<TIntensity extends string> = {
  id: string;
  label: string;
  color: HexColor;
  tiles: readonly TreemapTile<TIntensity>[];
};

export type { HexColor, IntensityScale, TreemapGroup, TreemapTile };
