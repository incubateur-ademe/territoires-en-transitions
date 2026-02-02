/**
 * Utility functions for deduplicating arrays based on various criteria
 */

/**
 * Deduplicates an array by a key extractor function
 * @param items Array of items to deduplicate
 * @param getKey Function that extracts a unique key from each item
 * @returns Deduplicated array (keeps first occurrence)
 */
export function deduplicateBy<T>(
  items: T[],
  getKey: (item: T) => string | number
): T[] {
  const seen = new Set<string | number>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Deduplicates an array of strings by normalized value (case-insensitive, trimmed)
 * Useful for deduplicating Excel-parsed values that may have whitespace/case variations
 * @param items Array of strings to deduplicate
 * @returns Deduplicated array (keeps first occurrence)
 */
export function deduplicateStrings(items: string[]): string[] {
  return deduplicateBy(items, (item) => item.toLowerCase().trim());
}

/**
 * Deduplicates an array of objects with an `id` property
 * @param items Array of objects with `id` property
 * @returns Deduplicated array (keeps first occurrence)
 */
export function deduplicateById<T extends { id: number }>(items: T[]): T[] {
  return deduplicateBy(items, (item) => item.id);
}

/**
 * Deduplicates an array of person identifiers (userId or tagId)
 * @param persons Array of person objects with userId or tagId
 * @returns Deduplicated array (keeps first occurrence)
 */
export function deduplicatePersons(
  persons: Array<{ userId?: string; tagId?: number }>
): Array<{ userId?: string; tagId?: number }> {
  return deduplicateBy(persons, (person) =>
    person.userId ? `user:${person.userId}` : `tag:${person.tagId}`
  );
}
