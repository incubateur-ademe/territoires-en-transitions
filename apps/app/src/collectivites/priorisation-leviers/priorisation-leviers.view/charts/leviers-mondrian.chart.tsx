import { appLabels } from '@/app/labels/catalog';
import { Caption } from '@/app/ui/charts/matrix/caption';
import type {
  HexColor,
  TreemapGroup,
} from '@/app/ui/charts/treemap/treemap-group';
import { TreemapChart } from '@/app/ui/charts/treemap/treemap.chart';
import { CategorieAction, LevierId } from '@tet/domain/shared';
import { preset } from '@tet/ui';
import { orderBy } from 'es-toolkit';
import { JSX, useMemo } from 'react';
import {
  LevierPlace,
  toLeviersToPrioritizeIds,
} from '../data/to-matrix-points';
import { SelectLevier } from '../select-levier';
import { LeviersDataDetails } from './leviers-data.details';
import {
  MOBILISATION_SCALE,
  MobilisationLevel,
  toMobilisationLabel,
  toMobilisationLevel,
  toMobilisationVariant,
} from './mobilisation-level';
import { toCategorieTooltip, toLevierTooltip } from './to-levier-tooltip';
import { LevierTile, toMondrianTiles } from './to-mondrian-tiles';

type LeviersMondrianChartProps = {
  places: LevierPlace[];
  selectedLevierId?: LevierId;
  selectedCategorie?: CategorieAction;
  onLevierSelected: SelectLevier;
};

const { colors } = preset.theme.extend;

const NON_PERTINENT_COLOR: HexColor = colors.grey[4];

const LEVIER_PALETTE: readonly HexColor[] = [
  '#404092',
  '#6A6AF4',
  '#91B2EE',
  '#1CC272',
  '#FFCA79',
  '#9747FF',
  '#4380F5',
  '#7B61FF',
  '#C3C3FB',
  '#F4C447',
  '#F55B5B',
];

const toLevierColor = ({
  levier,
  rank,
}: {
  levier: LevierTile;
  rank: number;
}): HexColor => {
  if (levier.pertinence === 'non_pertinent') {
    return NON_PERTINENT_COLOR;
  }
  return LEVIER_PALETTE[rank % LEVIER_PALETTE.length];
};

const toTreemapGroup = ({
  levier,
  rank,
  isFlagged,
}: {
  levier: LevierTile;
  rank: number;
  isFlagged: boolean;
}): TreemapGroup<MobilisationLevel, LevierId, CategorieAction> => ({
  id: levier.levierId,
  label: levier.nom,
  color: toLevierColor({ levier, rank }),
  isFlagged,
  displayedValue: levier.impactIndex,
  tooltip: toLevierTooltip(levier),
  tiles: levier.categories.map((categorieTile) => ({
    id: categorieTile.categorie,
    label: appLabels.categorieActionShortLabel(categorieTile.categorie),
    value: categorieTile.potentielReduction,
    displayedValue: categorieTile.impactIndex,
    tooltip: toCategorieTooltip({
      levierNom: levier.nom,
      categorie: categorieTile.categorie,
      impactIndex: categorieTile.impactIndex,
      note: categorieTile.note,
      pertinence: levier.pertinence,
    }),
    intensity: toMobilisationLevel(categorieTile.note),
  })),
});

export const LeviersMondrianChart = ({
  places,
  selectedLevierId,
  selectedCategorie,
  onLevierSelected,
}: LeviersMondrianChartProps): JSX.Element => {
  const tiles = useMemo(() => toMondrianTiles(places), [places]);
  const groups = useMemo(() => {
    const leviersToPrioritizeIds = toLeviersToPrioritizeIds(places);
    return orderBy(tiles, ['potentielReduction'], ['desc']).map(
      (levier, rank) =>
        toTreemapGroup({
          levier,
          rank,
          isFlagged: leviersToPrioritizeIds.includes(levier.levierId),
        })
    );
  }, [places, tiles]);
  return (
    <TreemapChart
      data={groups}
      intensityScale={MOBILISATION_SCALE}
      formatValue={appLabels.impactPotentielEstime}
      toIntensityLabel={toMobilisationLabel}
      toIntensityVariant={toMobilisationVariant}
      selectedGroupId={selectedLevierId}
      selectedTileId={selectedCategorie}
      onGroupSelected={onLevierSelected}
      details={<LeviersDataDetails places={places} />}
      className="h-matrix-chart"
    >
      <Caption>{appLabels.repartitionPotentielLegende}</Caption>
    </TreemapChart>
  );
};
