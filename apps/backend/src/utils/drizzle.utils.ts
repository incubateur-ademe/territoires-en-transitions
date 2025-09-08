import { arrayOverlaps, sql, SQLWrapper } from 'drizzle-orm';

// Patch pour permettre de passer un tableau directement à arrayOverlaps.
// Drizzle bug quand la colonne est un array de string.
// https://github.com/drizzle-team/drizzle-orm/issues/4034
export const arrayOverlapsPatched = <T extends string | number>(
  column: SQLWrapper,
  values: SQLWrapper | T[],
  options?: { cast?: string }
) => {
  // If caller already provides a SQL wrapper (e.g., a placeholder or prebuilt array), pass through
  if (
    values &&
    typeof values === 'object' &&
    values !== null &&
    'getSQL' in (values as unknown as Record<string, unknown>) &&
    typeof (values as unknown as { getSQL?: unknown }).getSQL === 'function'
  ) {
    return arrayOverlaps(column, values as SQLWrapper);
  }

  const arr = values as T[];
  if (!Array.isArray(arr) || arr.length === 0) {
    // Degenerate case: empty array cannot overlap anything. Return a safe false condition: column && '{}'::type[] is always false.
    // We produce `column && ARRAY[]::type[]` when cast provided, otherwise compare with an empty literal '{}'::text[] fallback.
    const emptySql = options?.cast
      ? sql`${sql.raw('ARRAY[]')}::${sql.raw(options.cast)}[]`
      : sql`${sql.raw("'{}'::text[]")}`;
    return arrayOverlaps(column, emptySql);
  }

  // Build a Postgres array literal like '{a,b,c}' without quoting numbers/uuids
  let rhs: SQLWrapper = sql`${`{${arr.join(',')}}`}`;
  if (options?.cast) {
    rhs = sql`${rhs}::${sql.raw(options.cast)}[]`;
  }
  return arrayOverlaps(column, rhs);
};
