import {
  IndicateurPeriodiciteEnum,
  type IndicateurPeriodicite,
} from '../definitions/indicateur-periodicite.schema';
import {
  createIndicateurPeriodError,
  IndicateurPeriodErrorEnum,
} from './indicateur-period.errors';

/**
 * Chart display controls calendar ticks, never the identity or number of values.
 * Each declaration cadence explicitly lists its supported display cadences.
 */
const displayPeriodicites: Readonly<
  Record<IndicateurPeriodicite, readonly IndicateurPeriodicite[]>
> = {
  [IndicateurPeriodiciteEnum.ANNUELLE]: [IndicateurPeriodiciteEnum.ANNUELLE],
  [IndicateurPeriodiciteEnum.MENSUELLE]: [
    IndicateurPeriodiciteEnum.MENSUELLE,
    IndicateurPeriodiciteEnum.ANNUELLE,
  ],
};

export const listIndicateurDisplayPeriodicites = (
  declaration: IndicateurPeriodicite
): readonly IndicateurPeriodicite[] => displayPeriodicites[declaration];

export const isIndicateurDisplayPeriodiciteAllowed = (
  declaration: IndicateurPeriodicite,
  display: IndicateurPeriodicite
): boolean => listIndicateurDisplayPeriodicites(declaration).includes(display);

export const resolveIndicateurDisplayPeriodicite = (
  declaration: IndicateurPeriodicite,
  display: IndicateurPeriodicite = declaration
): IndicateurPeriodicite => {
  if (!isIndicateurDisplayPeriodiciteAllowed(declaration, display)) {
    throw createIndicateurPeriodError({
      code: IndicateurPeriodErrorEnum.INDICATEUR_DISPLAY_PERIODICITE_INVALID,
      details: { declaration, display },
    });
  }
  return display;
};
