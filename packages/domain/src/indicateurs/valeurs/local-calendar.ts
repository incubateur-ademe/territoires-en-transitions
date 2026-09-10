import type { LocalCalendarDate, LocalDate } from './indicateur-period.types';

const MIN_YEAR = 1;
const MAX_YEAR = 9999;
const MONTHS_PER_YEAR = 12;
const LOCAL_DATE_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

type ParsedLocalDate = Readonly<{
  year: number;
  month: number;
  day: number;
}>;

const isLeapYear = (year: number): boolean =>
  year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

const daysInMonth = (year: number, month: number): number => {
  const monthLengths = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ] as const;
  return monthLengths[month - 1] ?? 0;
};

const assertCalendarDate = ({ year, month, day }: LocalCalendarDate): void => {
  const isValid =
    Number.isInteger(year) &&
    year >= MIN_YEAR &&
    year <= MAX_YEAR &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= MONTHS_PER_YEAR &&
    Number.isInteger(day) &&
    day >= 1 &&
    day <= daysInMonth(year, month);
  if (!isValid) {
    throw new Error(
      `Date calendaire invalide : ${String(year)}-${String(month)}-${String(
        day
      )}`
    );
  }
};

export const parseLocalDate = (value: string): ParsedLocalDate => {
  const match = LOCAL_DATE_PATTERN.exec(value);
  if (!match) {
    throw new Error(`Date locale "${value}" invalide`);
  }
  const date = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
  assertCalendarDate(date);
  return date;
};

export const toLocalDate = ({
  year,
  month,
  day,
}: LocalCalendarDate): LocalDate => {
  assertCalendarDate({ year, month, day });
  return `${String(year).padStart(4, '0')}-${String(month).padStart(
    2,
    '0'
  )}-${String(day).padStart(2, '0')}` as LocalDate;
};

export const monthIndex = (year: number, month: number): number =>
  (year - MIN_YEAR) * MONTHS_PER_YEAR + month - 1;

export const monthFromIndex = (
  index: number
): Readonly<{ year: number; month: number }> => {
  const maximumIndex = (MAX_YEAR - MIN_YEAR + 1) * MONTHS_PER_YEAR - 1;
  if (!Number.isInteger(index) || index < 0 || index > maximumIndex) {
    throw new Error('La période calculée dépasse les bornes du calendrier');
  }
  return {
    year: Math.floor(index / MONTHS_PER_YEAR) + MIN_YEAR,
    month: (index % MONTHS_PER_YEAR) + 1,
  };
};

export const monthsPerYear = MONTHS_PER_YEAR;
