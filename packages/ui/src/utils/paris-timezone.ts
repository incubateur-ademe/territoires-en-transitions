const PARIS_TIMEZONE = 'Europe/Paris';

/** Format a Date as YYYY-MM-DD in the Paris timezone. */
export const formatDateInParis = (date: Date): string =>
  date.toLocaleDateString('en-CA', { timeZone: PARIS_TIMEZONE });

/**
 * Parse a YYYY-MM-DD date string as midnight in the Paris timezone
 * and return the corresponding UTC Date.
 */
export const parseDateInParis = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  const utcNoon = Date.UTC(year, month - 1, day, 12);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PARIS_TIMEZONE,
    timeZoneName: 'shortOffset',
  });
  const offsetPart = formatter
    .formatToParts(new Date(utcNoon))
    .find((part) => part.type === 'timeZoneName')?.value;

  const offsetMatch = offsetPart?.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!offsetMatch) {
    return new Date(Date.UTC(year, month - 1, day));
  }

  const sign = offsetMatch[1] === '+' ? 1 : -1;
  const hours = Number(offsetMatch[2]);
  const minutes = Number(offsetMatch[3] ?? 0);
  const offsetMs = sign * (hours * 60 + minutes) * 60 * 1000;

  return new Date(Date.UTC(year, month - 1, day) - offsetMs);
};
