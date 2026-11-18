import { PALETTE } from '@/app/ui/charts/echarts/constants';
import { preset } from '@tet/ui';
import { uniq } from 'es-toolkit';

const FIRST_SERIES_PALETTE_INDEXES = [1, 3];

const SERIES_PALETTE: readonly string[] = [
  ...FIRST_SERIES_PALETTE_INDEXES.map((index) => PALETTE[index]),
  ...PALETTE.filter(
    (_, index) => !FIRST_SERIES_PALETTE_INDEXES.includes(index)
  ),
];

export const SOUS_INDICATEURS_TOTAL_COLOR =
  preset.theme.extend.colors.primary[9];

export const toSousIndicateurColorOf = (
  indicateurIds: readonly number[]
): ((indicateurId: number) => string) => {
  const colorByIndicateurId = new Map(
    uniq(indicateurIds).map((indicateurId, index) => [
      indicateurId,
      SERIES_PALETTE[index % SERIES_PALETTE.length],
    ])
  );
  return (indicateurId) =>
    colorByIndicateurId.get(indicateurId) ?? SERIES_PALETTE[0];
};
