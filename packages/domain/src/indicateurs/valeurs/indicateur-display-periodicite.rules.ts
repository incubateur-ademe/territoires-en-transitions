import {
  IndicateurPeriodiciteEnum,
  type IndicateurPeriodicite,
} from '../definitions/indicateur-periodicite.schema';
import {
  createIndicateurPeriodError,
  IndicateurPeriodErrorEnum,
} from './indicateur-period.errors';

/**
 * Display cadences group source observations without changing their stored identity.
 * Each declaration cadence explicitly lists its supported display cadences.
 */
const displayPeriodicites: Readonly<
  Record<IndicateurPeriodicite, readonly IndicateurPeriodicite[]>
> = {
  [IndicateurPeriodiciteEnum.ANNUELLE]: [IndicateurPeriodiciteEnum.ANNUELLE],
  [IndicateurPeriodiciteEnum.SEMESTRIELLE]: [
    IndicateurPeriodiciteEnum.SEMESTRIELLE,
    IndicateurPeriodiciteEnum.ANNUELLE,
  ],
  [IndicateurPeriodiciteEnum.TRIMESTRIELLE]: [
    IndicateurPeriodiciteEnum.TRIMESTRIELLE,
    IndicateurPeriodiciteEnum.SEMESTRIELLE,
    IndicateurPeriodiciteEnum.ANNUELLE,
  ],
  [IndicateurPeriodiciteEnum.MENSUELLE]: [
    IndicateurPeriodiciteEnum.MENSUELLE,
    IndicateurPeriodiciteEnum.TRIMESTRIELLE,
    IndicateurPeriodiciteEnum.SEMESTRIELLE,
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

/** Finest available source cadence, with declaration as the empty-view default. */
export const getIndicateurSourcePeriodicite = (
  declaration: IndicateurPeriodicite,
  sourcePeriodicites: readonly IndicateurPeriodicite[]
): IndicateurPeriodicite => {
  let finest: IndicateurPeriodicite | undefined;
  for (const periodicite of sourcePeriodicites) {
    if (
      !finest ||
      listIndicateurDisplayPeriodicites(periodicite).length >
        listIndicateurDisplayPeriodicites(finest).length
    ) {
      finest = periodicite;
    }
  }
  return finest ?? declaration;
};

/** Shared view default and validation for browser and server chart rendering. */
export const resolveIndicateurSourceDisplayPeriodicite = (
  declaration: IndicateurPeriodicite,
  sourcePeriodicites: readonly IndicateurPeriodicite[],
  requested?: IndicateurPeriodicite
): IndicateurPeriodicite => {
  const source = getIndicateurSourcePeriodicite(
    declaration,
    sourcePeriodicites
  );
  return resolveIndicateurDisplayPeriodicite(
    source,
    requested ??
      (isIndicateurDisplayPeriodiciteAllowed(source, declaration)
        ? declaration
        : source)
  );
};
