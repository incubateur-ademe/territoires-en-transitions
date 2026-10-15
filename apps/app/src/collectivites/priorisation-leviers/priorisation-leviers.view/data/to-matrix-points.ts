import type { MatrixPoint } from '@/app/ui/charts/matrix/matrix.chart';
import type { ChartTooltipBadge } from '@/app/ui/charts/chart-tooltip';
import type { MatrixTone } from '@/app/ui/charts/matrix/quadrant';
import { Pertinence } from '@tet/domain/collectivites';
import {
  CategorieAction,
  categorieActionEnumValues,
  LevierId,
  POTENTIEL_SHARE_BY_LEVIER,
} from '@tet/domain/shared';
import { chunk, maxBy, minBy, orderBy, round, sum } from 'es-toolkit';
import { LevierPriorisation } from './to-leviers-priorisation';
import { toSharesOf100 } from './to-shares-of-100';

export const MATRIX_SCALE = 100;

export const MATRIX_CUT = MATRIX_SCALE / 2;

const POTENTIEL_MAX_SCORE = 90;

export type LevierPlace = LevierPriorisation & {
  potentielReduction: number;
  potentielScore: number;
  impactIndex: number;
  impactIndexByCategorie: ReadonlyMap<CategorieAction, number>;
};

type Quadrant =
  | 'high_impact_low_mobilisation'
  | 'high_impact_high_mobilisation'
  | 'low_impact_low_mobilisation'
  | 'low_impact_high_mobilisation';

export const PRESELECTED_TONE: MatrixTone = 'default';

export const TONE_BY_PERTINENCE: Record<Pertinence, MatrixTone> = {
  pertinent: 'grey',
  non_pertinent: 'light',
};

const hasPotentiel = (levier: LevierPriorisation): levier is LevierPlace =>
  levier.potentielReduction !== undefined;

export const toLeviersWithoutPotentiel = (
  leviers: LevierPriorisation[]
): LevierPriorisation[] => leviers.filter((levier) => !hasPotentiel(levier));

const toImpactIndexesByLevier = (
  places: (LevierPriorisation & { potentielReduction: number })[]
): ReadonlyMap<CategorieAction, number>[] => {
  const categorieReductions = places.flatMap((levier) =>
    categorieActionEnumValues.map(
      (categorie) =>
        levier.potentielReduction *
        POTENTIEL_SHARE_BY_LEVIER[levier.levierId][categorie]
    )
  );
  return chunk(
    toSharesOf100(categorieReductions),
    categorieActionEnumValues.length
  ).map(
    (impactIndexes) =>
      new Map(
        categorieActionEnumValues.map((categorie, index) => [
          categorie,
          impactIndexes[index],
        ])
      )
  );
};

export const toLeviersPlaces = (
  leviers: LevierPriorisation[]
): LevierPlace[] => {
  const places = leviers.filter(hasPotentiel);
  const potentielMax = Math.max(
    0,
    ...places.map(({ potentielReduction }) => potentielReduction)
  );
  const impactIndexesByLevier = toImpactIndexesByLevier(places);
  return places.map((levier, index) => {
    const impactIndexByCategorie = impactIndexesByLevier[index];
    return {
      ...levier,
      potentielScore:
        potentielMax === 0
          ? 0
          : round(
              (levier.potentielReduction / potentielMax) * POTENTIEL_MAX_SCORE
            ),
      impactIndex: sum([...impactIndexByCategorie.values()]),
      impactIndexByCategorie,
    };
  });
};

export const isHighPotentiel = (potentielScore: number): boolean =>
  potentielScore >= MATRIX_CUT;

export const toQuadrant = ({
  mobilisationScore,
  potentielScore,
}: Pick<LevierPlace, 'mobilisationScore' | 'potentielScore'>): Quadrant => {
  const hasHighPotentiel = isHighPotentiel(potentielScore);
  const isWellMobilized = mobilisationScore >= MATRIX_CUT;
  if (hasHighPotentiel && !isWellMobilized) {
    return 'high_impact_low_mobilisation';
  }
  if (hasHighPotentiel) {
    return 'high_impact_high_mobilisation';
  }
  if (isWellMobilized) {
    return 'low_impact_high_mobilisation';
  }
  return 'low_impact_low_mobilisation';
};

export const isBlindSpot = (levier: LevierPlace): boolean =>
  levier.pertinence !== 'non_pertinent' &&
  toQuadrant(levier) === 'high_impact_low_mobilisation';

export const toLevierToPrioritizeId = (
  places: LevierPlace[]
): LevierId | undefined =>
  maxBy(places.filter(isBlindSpot), ({ potentielScore }) => potentielScore)
    ?.levierId;

const isPertinent = (levier: LevierPlace): boolean =>
  levier.pertinence !== 'non_pertinent';

const distanceToTopLeftCorner = ({
  mobilisationScore,
  potentielScore,
}: Pick<LevierPlace, 'mobilisationScore' | 'potentielScore'>): number =>
  Math.hypot(mobilisationScore, MATRIX_SCALE - potentielScore);

const findClosestToTopLeftCorner = (
  places: LevierPlace[]
): LevierPlace | undefined =>
  minBy(places.filter(isPertinent), distanceToTopLeftCorner);

export const findLevierToPrioritizeId = (
  places: LevierPlace[]
): LevierId | undefined =>
  toLevierToPrioritizeId(places) ??
  findClosestToTopLeftCorner(places)?.levierId;

const LEVIERS_TO_PRIORITIZE_COUNT = 2;

export const toLeviersToPrioritizeIds = (places: LevierPlace[]): LevierId[] =>
  orderBy(places.filter(isBlindSpot), ['potentielScore'], ['desc'])
    .slice(0, LEVIERS_TO_PRIORITIZE_COUNT)
    .map(({ levierId }) => levierId);

export type PreselectedCountByLevier = ReadonlyMap<LevierId, number>;

export type LevierTooltipInput = {
  levier: LevierPlace;
  preselectedCount: number;
};

export type LevierTooltip = {
  description: readonly string[];
  badge: ChartTooltipBadge;
  hint: string;
};

const toTone = ({
  levier,
  preselectedCount,
}: LevierTooltipInput): MatrixTone => {
  if (preselectedCount > 0) {
    return PRESELECTED_TONE;
  }
  return TONE_BY_PERTINENCE[levier.pertinence ?? 'pertinent'];
};

export const toMatrixPoints = ({
  places,
  preselectedCountByLevier,
  toTooltip,
}: {
  places: LevierPlace[];
  preselectedCountByLevier: PreselectedCountByLevier;
  toTooltip: (input: LevierTooltipInput) => LevierTooltip;
}): MatrixPoint[] =>
  places.map((levier) => {
    const preselectedCount = preselectedCountByLevier.get(levier.levierId) ?? 0;
    return {
      id: levier.levierId,
      label: levier.nom,
      ...toTooltip({ levier, preselectedCount }),
      x: levier.mobilisationScore,
      y: levier.potentielScore,
      tone: toTone({ levier, preselectedCount }),
      isLabelled: isBlindSpot(levier),
    };
  });
