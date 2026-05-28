export function toggleArrayValue<T>(values: T[], value: T, add?: boolean): T[] {
  const next = new Set(values);
  if (add === undefined) {
    add = !next.has(value);
  }
  if (add) {
    next.add(value);
  } else {
    next.delete(value);
  }
  return Array.from(next);
}
