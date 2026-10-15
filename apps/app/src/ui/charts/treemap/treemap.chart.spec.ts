import { describe, expect, it } from 'vitest';
import { toHeaderColor } from './to-tile-color';
import type { IntensityScale, TreemapGroup } from './treemap-group';
import { toSeriesData } from './treemap.chart';

type Intensity = 'low' | 'high';

const INTENSITY_SCALE: IntensityScale<Intensity> = ['low', 'high'];

const toGroup = ({
  id,
  color,
}: {
  id: string;
  color: `#${string}`;
}): TreemapGroup<Intensity> => ({
  id,
  label: id,
  color,
  tiles: [
    { id: 'financement', label: 'Financement', value: 10, intensity: 'low' },
    { id: 'ingenierie', label: 'Ingénierie', value: 5, intensity: 'high' },
  ],
});

const GROUPS = [
  toGroup({ id: 'biogaz', color: '#404092' }),
  toGroup({ id: 'velos', color: '#1CC272' }),
];

const toHighlightedTiles = (
  series: ReturnType<typeof toSeriesData>
): string[] =>
  (series ?? []).flatMap((group) =>
    (group.children ?? [])
      .filter((tile) => (tile.itemStyle?.borderWidth ?? 0) > 1)
      .map((tile) => `${group.name}/${tile.name}`)
  );

const toHighlightedGroups = (
  series: ReturnType<typeof toSeriesData>
): string[] =>
  (series ?? [])
    .filter(
      (group, index) =>
        group.itemStyle?.borderColor !== toHeaderColor(GROUPS[index].color)
    )
    .map((group) => String(group.name));

describe('toSeriesData', () => {
  it('trace la tuile choisie avec un contour de 2 px', () => {
    const series = toSeriesData({
      data: GROUPS,
      intensityScale: INTENSITY_SCALE,
      selectedGroupId: 'biogaz',
      selectedTileId: 'financement',
    });

    expect(series?.[0].children?.[0].itemStyle?.borderWidth).toBe(2);
  });

  it('ne met en avant que la tuile choisie quand une catégorie est sélectionnée', () => {
    const series = toSeriesData({
      data: GROUPS,
      intensityScale: INTENSITY_SCALE,
      selectedGroupId: 'biogaz',
      selectedTileId: 'financement',
    });

    expect({
      tiles: toHighlightedTiles(series),
      groups: toHighlightedGroups(series),
    }).toEqual({ tiles: ['biogaz/Financement'], groups: [] });
  });

  it("met en avant le levier entier quand aucune catégorie n'est sélectionnée", () => {
    const series = toSeriesData({
      data: GROUPS,
      intensityScale: INTENSITY_SCALE,
      selectedGroupId: 'biogaz',
    });

    expect({
      tiles: toHighlightedTiles(series),
      groups: toHighlightedGroups(series),
    }).toEqual({ tiles: [], groups: ['biogaz'] });
  });
});
