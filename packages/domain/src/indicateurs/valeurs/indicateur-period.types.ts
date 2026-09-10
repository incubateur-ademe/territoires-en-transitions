import type { IndicateurPeriodicite } from '../definitions/indicateur-periodicite.schema';

/** @internal Publicly nameable so downstream declaration emit preserves the brand. */
export const localDateBrand: unique symbol = Symbol('LocalDate');
/** @internal Publicly nameable so downstream declaration emit preserves the brand. */
export const indicateurPeriodBrand: unique symbol = Symbol('IndicateurPeriod');
/** @internal Publicly nameable so downstream declaration emit preserves the brand. */
export const indicateurPeriodKeyBrand: unique symbol = Symbol(
  'IndicateurPeriodKey'
);

/** A calendar date without time or timezone, serialized as `YYYY-MM-DD`. */
export type LocalDate = string & { readonly [localDateBrand]: true };

/**
 * A validated, self-describing period.
 *
 * The brand has no runtime representation: periods remain plain serializable
 * objects across tRPC and React Server Component boundaries.
 */
export type IndicateurPeriod<
  K extends IndicateurPeriodicite = IndicateurPeriodicite
> = Readonly<{
  periodicite: K;
  dateDebut: LocalDate;
  readonly [indicateurPeriodBrand]: true;
}>;

/** Untrusted JSON shape accepted by `indicateurPeriodSchema`. */
export type IndicateurPeriodJson = Readonly<{
  periodicite: IndicateurPeriodicite;
  dateDebut: string;
}>;

/** Stable identity for maps, sets, DOM attributes and cache keys. */
export type IndicateurPeriodKey = string & {
  readonly [indicateurPeriodKeyBrand]: true;
};

/** Local calendar values captured by the caller, without an implicit clock. */
export type LocalCalendarDate = Readonly<{
  year: number;
  month: number;
  day: number;
}>;

export type IndicateurPeriodParseResult =
  | Readonly<{ success: true; period: IndicateurPeriod }>
  | Readonly<{ success: false; error: Error }>;
