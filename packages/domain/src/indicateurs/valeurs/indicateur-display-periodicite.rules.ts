import type { IndicateurPeriodicite } from '../definitions/indicateur-periodicite.schema';

/**
 * Chart display controls calendar ticks, never the identity or number of values.
 * Each declaration cadence explicitly lists its supported display cadences.
 */
const displayPeriodicites: Readonly<
  Record<IndicateurPeriodicite, readonly IndicateurPeriodicite[]>
> = {
  annuelle: ['annuelle'],
  mensuelle: ['mensuelle', 'annuelle'],
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
    throw new Error(
      "La périodicité d'affichage doit être identique ou plus large que la périodicité de déclaration"
    );
  }
  return display;
};
