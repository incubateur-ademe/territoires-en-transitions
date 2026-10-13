import type { IndicateurPeriodicite } from '../definitions/indicateur-periodicite.schema';

/** @internal Publicly nameable so downstream declaration emit preserves the brand. */
export const localDateBrand: unique symbol = Symbol('LocalDate');
/** @internal Publicly nameable so downstream declaration emit preserves the brand. */
export const indicateurPeriodeBrand: unique symbol =
  Symbol('IndicateurPeriode');
/** @internal Publicly nameable so downstream declaration emit preserves the brand. */
export const indicateurPeriodeKeyBrand: unique symbol = Symbol(
  'IndicateurPeriodeKey'
);

/** A calendar date without time or timezone, serialized as `YYYY-MM-DD`. */
export type LocalDate = string & { readonly [localDateBrand]: true };

/**
 * A validated, self-describing period.
 *
 * The brand has no runtime representation: periods remain plain serializable
 * objects across tRPC and React Server Component boundaries.
 */
export type IndicateurPeriode<
  K extends IndicateurPeriodicite = IndicateurPeriodicite
> = Readonly<{
  periodicite: K;
  dateDebut: LocalDate;
  readonly [indicateurPeriodeBrand]: true;
}>;

/** Untrusted JSON shape accepted by `indicateurPeriodeSchema`. */
export type IndicateurPeriodeJson = Readonly<{
  periodicite: IndicateurPeriodicite;
  dateDebut: string;
}>;

/** Stable identity for maps, sets, DOM attributes and cache keys. */
export type IndicateurPeriodeKey = string & {
  readonly [indicateurPeriodeKeyBrand]: true;
};

/** Local calendar values captured by the caller, without an implicit clock. */
export type LocalCalendarDate = Readonly<{
  year: number;
  month: number;
  day: number;
}>;
