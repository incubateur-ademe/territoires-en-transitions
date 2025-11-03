export const computeDateRange = (
  start: Date | null,
  end: Date | null
): [Date, Date] | null => {
  const ONE_DAY_IN_MILLISECONDS = 86400000;

  if (start && end) return [start, end];
  if (start)
    return [start, new Date(start.getTime() + ONE_DAY_IN_MILLISECONDS)];
  if (end) return [new Date(end.getTime() - ONE_DAY_IN_MILLISECONDS), end];

  return null;
};
