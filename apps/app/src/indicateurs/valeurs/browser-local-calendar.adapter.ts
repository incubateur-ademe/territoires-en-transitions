import type { LocalCalendarDate, LocalDate } from '@tet/domain/indicateurs';

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Browser-clock adapter. Calendar semantics remain in `IndicateurPeriods`. */
export const toBrowserLocalCalendarDate = (date: Date): LocalCalendarDate => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  day: date.getDate(),
});

/** Converts a domain local date to the corresponding browser-local instant. */
export const toBrowserLocalMidnight = (date: LocalDate): Date => {
  const match = LOCAL_DATE_PATTERN.exec(date);
  if (match === null) {
    throw new Error(`Date locale invalide : ${date}`);
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};
