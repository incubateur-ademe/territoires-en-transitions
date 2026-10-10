import { createEnumObject } from '../../utils/enum.utils';
import type { IndicateurPeriodicite } from '../definitions/indicateur-periodicite.schema';
import type { LocalCalendarDate } from './indicateur-period.types';

const indicateurPeriodErrorCodes = [
  'INDICATEUR_PERIODICITE_MISMATCH',
  'INDICATEUR_PERIODICITE_UNKNOWN',
  'INDICATEUR_PERIOD_KEY_INVALID',
  'INDICATEUR_PERIOD_INVALID',
  'INDICATEUR_PERIOD_DATE_NON_CANONICAL',
  'INDICATEUR_PERIOD_OFFSET_INVALID',
  'INDICATEUR_CALENDAR_STEP_INVALID',
  'INDICATEUR_CALENDAR_ANCHOR_INVALID',
  'INDICATEUR_PERIOD_SERIALIZATION_INCOMPATIBLE',
  'INDICATEUR_CALENDAR_DATE_INVALID',
  'INDICATEUR_LOCAL_DATE_INVALID',
  'INDICATEUR_CALENDAR_OUT_OF_RANGE',
  'INDICATEUR_DISPLAY_PERIODICITE_INVALID',
  'INDICATEUR_ANNUAL_PERIODICITE_REQUIRED',
] as const;

export const IndicateurPeriodErrorEnum = createEnumObject(
  indicateurPeriodErrorCodes
);

export type IndicateurPeriodErrorCode =
  (typeof indicateurPeriodErrorCodes)[number];

type IndicateurPeriodErrorDetails = {
  INDICATEUR_PERIODICITE_MISMATCH: {
    expected: IndicateurPeriodicite;
    actual: IndicateurPeriodicite;
  };
  INDICATEUR_PERIODICITE_UNKNOWN: { periodicite: string };
  INDICATEUR_PERIOD_KEY_INVALID: { value: string };
  INDICATEUR_PERIOD_INVALID: {
    periodicite: IndicateurPeriodicite;
    value: string;
  };
  INDICATEUR_PERIOD_DATE_NON_CANONICAL: {
    periodicite: IndicateurPeriodicite;
    dateValeur: string;
  };
  INDICATEUR_PERIOD_OFFSET_INVALID: { amount: number };
  INDICATEUR_CALENDAR_STEP_INVALID: {
    periodicite: IndicateurPeriodicite;
    monthsPerPeriod: number;
  };
  INDICATEUR_CALENDAR_ANCHOR_INVALID: {
    periodicite: IndicateurPeriodicite;
    anchorDate: string;
  };
  INDICATEUR_PERIOD_SERIALIZATION_INCOMPATIBLE: {
    periodicite: IndicateurPeriodicite;
    monthsPerPeriod: number;
    anchorDate: string;
    serialization: string;
  };
  INDICATEUR_CALENDAR_DATE_INVALID: LocalCalendarDate;
  INDICATEUR_LOCAL_DATE_INVALID: { value: string };
  INDICATEUR_CALENDAR_OUT_OF_RANGE: { index: number };
  INDICATEUR_DISPLAY_PERIODICITE_INVALID: {
    declaration: IndicateurPeriodicite;
    display: IndicateurPeriodicite;
  };
  INDICATEUR_ANNUAL_PERIODICITE_REQUIRED: {
    periodicite: IndicateurPeriodicite | null | undefined;
    capability: string;
  };
};

type IndicateurPeriodErrorPayload = {
  [Code in IndicateurPeriodErrorCode]: Readonly<{
    code: Code;
    details: Readonly<IndicateurPeriodErrorDetails[Code]>;
  }>;
}[IndicateurPeriodErrorCode];

export type IndicateurPeriodError = Error & IndicateurPeriodErrorPayload;

/** Keeps diagnostic data independent of the wording chosen by API/UI consumers. */
export const createIndicateurPeriodError = (
  error: IndicateurPeriodErrorPayload
): IndicateurPeriodError =>
  Object.assign(
    new Error(error.code),
    { name: 'IndicateurPeriodError' },
    error
  );

export const isIndicateurPeriodError = (
  error: unknown
): error is IndicateurPeriodError =>
  error instanceof Error &&
  error.name === 'IndicateurPeriodError' &&
  'code' in error &&
  typeof error.code === 'string' &&
  (indicateurPeriodErrorCodes as readonly string[]).includes(error.code) &&
  'details' in error &&
  error.details !== null &&
  typeof error.details === 'object';
