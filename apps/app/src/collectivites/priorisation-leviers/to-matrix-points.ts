import type { MatrixPoint } from '@/app/ui/charts/matrix/matrix.chart';
import type { MatrixTone } from '@/app/ui/charts/matrix/quadrant';
import { Pertinence } from '@tet/domain/collectivites';
import { LevierId } from '@tet/domain/shared';
import { round } from 'es-toolkit';
import { LevierPriorisation } from './to-leviers-priorisation';

export const MATRIX_SCALE = 100;

export const MATRIX_CUT = MATRIX_SCALE / 2;

const POTENTIEL_MAX_SCORE = 90;

export type LevierPlace = LevierPriorisation & {
  potentielReduction: number;
  potentielScore: number;
};

type Quadrant =
  | 'high_impact_low_mobilisation'
  | 'high_impact_high_mobilisation'
  | 'low_impact_low_mobilisation'
  | 'low_impact_high_mobilisation';

const TONE_BY_PERTINENCE: Record<Pertinence, MatrixTone> = {
  pertinent: 'grey',
  non_pertinent: 'light',
};

const hasPotentiel = (levier: LevierPriorisation): levier is LevierPlace =>
  levier.potentielReduction !== undefined;

export const toLeviersWithoutPotentiel = (
  leviers: LevierPriorisation[]
): LevierPriorisation[] => leviers.filter((levier) => !hasPotentiel(levier));

export const toLeviersPlaces = (
  leviers: LevierPriorisation[]
): LevierPlace[] => {
  const places = leviers.filter(hasPotentiel);
  const potentielMax = Math.max(
    0,
    ...places.map(({ potentielReduction }) => potentielReduction)
  );
  if (potentielMax === 0) {
    return places.map((levier) => ({ ...levier, potentielScore: 0 }));
  }
  return places.map((levier) => ({
    ...levier,
    potentielScore: round(
      (levier.potentielReduction / potentielMax) * POTENTIEL_MAX_SCORE
    ),
  }));
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

export type PreselectedCountByLevier = ReadonlyMap<LevierId, number>;

export type LevierTooltipInput = {
  levier: LevierPlace;
  preselectedCount: number;
};

export type LevierTooltip = {
  description: readonly string[];
  hint: string;
};

const toTone = ({
  levier,
  preselectedCount,
}: LevierTooltipInput): MatrixTone => {
  if (preselectedCount > 0) {
    return 'default';
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
