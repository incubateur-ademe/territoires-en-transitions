import { appLabels } from '@/app/labels/catalog';
import { COULEURS_BY_SECTEUR } from '@/app/shared/secteurs/secteur-colors';
import { Caption } from '@/app/ui/charts/matrix/caption';
import type {
  HexColor,
  TreemapGroup,
} from '@/app/ui/charts/treemap/treemap-group';
import { TreemapChart } from '@/app/ui/charts/treemap/treemap.chart';
import {
  CategorieAction,
  LEVIER_NOM_BY_ID,
  LEVIER_SECTEURS,
  LevierId,
} from '@tet/domain/shared';
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

const toLevierColor = (levier: LevierTile): HexColor => {
  if (levier.pertinence === 'non_pertinent') {
    return NON_PERTINENT_COLOR;
  }
  const secteur = LEVIER_SECTEURS[LEVIER_NOM_BY_ID[levier.levierId]];
  return COULEURS_BY_SECTEUR[secteur];
};

const toTreemapGroup = ({
  levier,
  isFlagged,
}: {
  levier: LevierTile;
  isFlagged: boolean;
}): TreemapGroup<MobilisationLevel, LevierId, CategorieAction> => ({
  id: levier.levierId,
  label: levier.nom,
  color: toLevierColor(levier),
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
    return orderBy(tiles, ['potentielReduction'], ['desc']).map((levier) =>
      toTreemapGroup({
        levier,
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
