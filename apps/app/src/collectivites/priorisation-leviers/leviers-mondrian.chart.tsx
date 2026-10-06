import { appLabels } from '@/app/labels/catalog';
import { Caption } from '@/app/ui/charts/matrix/caption';
import { TreemapChart } from '@/app/ui/charts/treemap/treemap.chart';
import type {
  HexColor,
  IntensityVariant,
  TreemapGroup,
} from '@/app/ui/charts/treemap/treemap-group';
import { LevierId, levierIdEnumValues } from '@tet/domain/shared';
import { preset } from '@tet/ui';
import { color } from 'echarts/core';
import { sumBy } from 'es-toolkit';
import { JSX, useCallback, useMemo } from 'react';
import {
  MOBILISATION_SCALE,
  MobilisationLevel,
  toMobilisationLabel,
  toMobilisationLevel,
} from './mobilisation-level';
import { toImpactPotentielLabel } from './to-impact-potentiel-label';
import { LevierPlace } from './to-matrix-points';
import { LevierTile, toMondrianTiles } from './to-mondrian-tiles';

type LeviersMondrianChartProps = {
  places: LevierPlace[];
  selectedLevierId?: LevierId;
  onLevierSelected: (levierId: LevierId) => void;
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
): TreemapGroup<MobilisationLevel, LevierId> => ({
  id: levier.levierId,
  label: levier.nom,
  color: toLevierColor(levier),
  tiles: levier.categories.map((categorie) => ({
    id: categorie.categorie,
    label: appLabels.categorieActionLabel(categorie.categorie),
    value: categorie.potentielReduction,
    intensity: toMobilisationLevel(categorie.note),
  })),
});

export const LeviersMondrianChart = ({
  places,
  selectedLevierId,
  onLevierSelected,
}: LeviersMondrianChartProps): JSX.Element => {
  const tiles = useMemo(() => toMondrianTiles(places), [places]);
  const groups = useMemo(() => tiles.map(toTreemapGroup), [tiles]);
  const potentielTotal = sumBy(tiles, (levier) => levier.potentielReduction);

  const formatValue = useCallback(
    (potentielReduction: number): string =>
      toImpactPotentielLabel({ potentielReduction, potentielTotal }),
    [potentielTotal]
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
