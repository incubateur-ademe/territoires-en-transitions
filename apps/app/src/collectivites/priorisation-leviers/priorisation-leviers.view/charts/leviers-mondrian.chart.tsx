import { appLabels } from '@/app/labels/catalog';
import { Caption } from '@/app/ui/charts/matrix/caption';
import type {
  HexColor,
  IntensityVariant,
  TreemapGroup,
} from '@/app/ui/charts/treemap/treemap-group';
import { TreemapChart } from '@/app/ui/charts/treemap/treemap.chart';
import {
  CategorieAction,
  LevierId,
  levierIdEnumValues,
} from '@tet/domain/shared';
import { preset } from '@tet/ui';
import { color } from 'echarts/core';
import { sumBy } from 'es-toolkit';
import { JSX, useMemo } from 'react';
import { LevierPlace } from '../data/to-matrix-points';
import { SelectLevier } from '../select-levier';
import {
  MOBILISATION_SCALE,
  MobilisationLevel,
  toMobilisationLabel,
  toMobilisationLevel,
} from './mobilisation-level';
import { LevierTile, toMondrianTiles } from './to-mondrian-tiles';
import { useFormatImpactPotentiel } from './use-format-impact-potentiel';

type LeviersMondrianChartProps = {
  places: LevierPlace[];
  selectedLevierId?: LevierId;
  onLevierSelected: SelectLevier;
};

const { colors } = preset.theme.extend;

const NON_PERTINENT_COLOR: HexColor = colors.grey[4];

const FULL_HUE_CIRCLE = 360;
const LEVIER_SATURATION = 45;
const LEVIER_LIGHTNESS = 70;

const VARIANT_BY_MOBILISATION_LEVEL: Record<
  MobilisationLevel,
  IntensityVariant
> = {
  none: 'grey',
  partial: 'warning',
  good: 'success',
  full: 'success',
};

const toMobilisationVariant = (level: MobilisationLevel): IntensityVariant =>
  VARIANT_BY_MOBILISATION_LEVEL[level];

const toLevierColor = (levier: LevierTile): HexColor => {
  if (levier.pertinence === 'non_pertinent') {
    return NON_PERTINENT_COLOR;
  }
  const levierRank = levierIdEnumValues.indexOf(levier.levierId);
  const hue = Math.round(
    (FULL_HUE_CIRCLE / levierIdEnumValues.length) * levierRank
  );
  return `#${color.toHex(
    `hsl(${hue}, ${LEVIER_SATURATION}%, ${LEVIER_LIGHTNESS}%)`
  )}`;
};

const toTreemapGroup = (
  levier: LevierTile
): TreemapGroup<MobilisationLevel, LevierId, CategorieAction> => ({
  id: levier.levierId,
  label: levier.nom,
  color: toLevierColor(levier),
  tiles: levier.categories.map((categorieTile) => ({
    id: categorieTile.categorie,
    label: appLabels.categorieActionLabel(categorieTile.categorie),
    value: categorieTile.potentielReduction,
    intensity: toMobilisationLevel(categorieTile.note),
  })),
});

export const LeviersMondrianChart = ({
  places,
  selectedLevierId,
  onLevierSelected,
}: LeviersMondrianChartProps): JSX.Element => {
  const tiles = useMemo(() => toMondrianTiles(places), [places]);
  const groups = useMemo(() => tiles.map(toTreemapGroup), [tiles]);
  const formatValue = useFormatImpactPotentiel(
    sumBy(tiles, (levier) => levier.potentielReduction)
  );

  return (
    <TreemapChart
      data={groups}
      intensityScale={MOBILISATION_SCALE}
      formatValue={formatValue}
      toIntensityLabel={toMobilisationLabel}
      toIntensityVariant={toMobilisationVariant}
      tooltipHint={appLabels.cliquerPourVoirLesActionsDuLevier}
      selectedGroupId={selectedLevierId}
      onGroupSelected={onLevierSelected}
      className="h-matrix-chart"
    >
      <Caption>{appLabels.repartitionPotentielLegende}</Caption>
    </TreemapChart>
  );
};
