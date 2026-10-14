import { createEnumObject } from '../../utils/enum.utils';
import type { IndicateurPeriodicite } from '../definitions/indicateur-periodicite.schema';
import type { LocalCalendarDate } from './indicateur-periode.types';

const indicateurPeriodeErrorCodes = [
  'INDICATEUR_PERIODICITE_MISMATCH',
  'INDICATEUR_PERIODICITE_UNKNOWN',
  'INDICATEUR_PERIODE_KEY_INVALID',
  'INDICATEUR_PERIODE_OFFSET_INVALID',
  'INDICATEUR_CALENDAR_STEP_INVALID',
  'INDICATEUR_CALENDAR_ANCHOR_INVALID',
  'INDICATEUR_PERIODE_SERIALIZATION_INCOMPATIBLE',
  'INDICATEUR_CALENDAR_OUT_OF_RANGE',
  'INDICATEUR_PERIODE_INVALID',
  'INDICATEUR_PERIODICITE_UNSUPPORTED',
  'INDICATEUR_PERIODE_DATE_NON_CANONICAL',
  'INDICATEUR_CALENDAR_DATE_INVALID',
  'INDICATEUR_LOCAL_DATE_INVALID',
  'INDICATEUR_ANNUAL_PERIODICITE_REQUIRED',
] as const;

export const IndicateurPeriodeErrorEnum = createEnumObject(
  indicateurPeriodeErrorCodes
);

export type IndicateurPeriodeErrorCode =
  (typeof indicateurPeriodeErrorCodes)[number];

type IndicateurPeriodeErrorDetails = {
  INDICATEUR_PERIODICITE_MISMATCH: {
    expected: IndicateurPeriodicite;
    actual: IndicateurPeriodicite;
  };
  INDICATEUR_PERIODICITE_UNKNOWN: { periodicite: string };
  INDICATEUR_PERIODE_KEY_INVALID: { value: string };
  INDICATEUR_PERIODE_OFFSET_INVALID: { amount: number };
  INDICATEUR_CALENDAR_STEP_INVALID: {
    periodicite: IndicateurPeriodicite;
    monthsPerPeriod: number;
  };
  INDICATEUR_CALENDAR_ANCHOR_INVALID: {
    periodicite: IndicateurPeriodicite;
    anchorDate: string;
  };
  INDICATEUR_PERIODE_SERIALIZATION_INCOMPATIBLE: {
    periodicite: IndicateurPeriodicite;
    monthsPerPeriod: number;
    anchorDate: string;
    serialization: string;
  };
  INDICATEUR_CALENDAR_OUT_OF_RANGE: { index: number };
  INDICATEUR_PERIODICITE_UNSUPPORTED: {
    periodicite: IndicateurPeriodicite;
  };
  INDICATEUR_PERIODE_INVALID: {
    periodicite: IndicateurPeriodicite;
    value: string;
  };
  INDICATEUR_PERIODE_DATE_NON_CANONICAL: {
    periodicite: IndicateurPeriodicite;
    dateValeur: string;
  };
  INDICATEUR_CALENDAR_DATE_INVALID: LocalCalendarDate;
  INDICATEUR_LOCAL_DATE_INVALID: { value: string };
  INDICATEUR_ANNUAL_PERIODICITE_REQUIRED: {
    periodicite: IndicateurPeriodicite | null | undefined;
    capability: string;
  };
};

type IndicateurPeriodeErrorPayload = {
  [Code in IndicateurPeriodeErrorCode]: Readonly<{
    code: Code;
    details: Readonly<IndicateurPeriodeErrorDetails[Code]>;
  }>;
}[IndicateurPeriodeErrorCode];

export type IndicateurPeriodeError = Error & IndicateurPeriodeErrorPayload;

/** Keeps diagnostic data independent of the wording chosen by API/UI consumers. */
export const createIndicateurPeriodeError = (
  error: IndicateurPeriodeErrorPayload
): IndicateurPeriodeError =>
  Object.assign(
    new Error(error.code),
    { name: 'IndicateurPeriodeError' },
    error
  );

export const isIndicateurPeriodeError = (
  error: unknown
): error is IndicateurPeriodeError =>
  error instanceof Error &&
  error.name === 'IndicateurPeriodeError' &&
  'code' in error &&
  typeof error.code === 'string' &&
  (indicateurPeriodeErrorCodes as readonly string[]).includes(error.code) &&
  'details' in error &&
  error.details !== null &&
  typeof error.details === 'object';
