import { IndicateurPeriodiciteEnum } from '../definitions/indicateur-periodicite.schema';
import { IndicateurPeriods } from './indicateur-period';
import type {
  IndicateurPeriod,
  IndicateurPeriodKey,
} from './indicateur-period.types';

export type IndicateurReferenceObjectif = Readonly<{
  dateValeur: string;
  valeur: number;
}>;

export type IndicateurReferenceObjectifHorizon = Readonly<{
  horizon: IndicateurPeriod<typeof IndicateurPeriodiciteEnum.ANNUELLE>;
  valeur: number;
}>;

/**
 * Positions reference objectives on annual horizons, independently from the
 * observation periodicity. Historical imports may contain several dates in a
 * year; the objective with the latest date deterministically wins.
 */
export const normalizeIndicateurReferenceObjectifs = (
  objectifs: readonly IndicateurReferenceObjectif[]
): readonly IndicateurReferenceObjectifHorizon[] => {
  const objectifByHorizon = new Map<
    IndicateurPeriodKey,
    IndicateurReferenceObjectifHorizon
  >();

  objectifs
    .toSorted((left, right) => left.dateValeur.localeCompare(right.dateValeur))
    .forEach(({ dateValeur, valeur }) => {
      const horizon = IndicateurPeriods.containing(
        IndicateurPeriodiciteEnum.ANNUELLE,
        dateValeur
      );
      objectifByHorizon.set(IndicateurPeriods.key(horizon), {
        horizon,
        valeur,
      });
    });

  return Array.from(objectifByHorizon.values());
};
