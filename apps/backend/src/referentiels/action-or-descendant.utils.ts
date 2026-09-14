import { escapeLikePattern } from '@tet/backend/utils/database/like-pattern.utils';
import { ActionId } from '@tet/domain/referentiels';
import { Column, SQL, sql } from 'drizzle-orm';

export const matchesActionOrDescendant = (
  column: Column | SQL.Aliased,
  actionId: ActionId
): SQL => {
  const descendantPattern = `${escapeLikePattern(actionId)}.%`;
  return sql`(${column} = ${actionId} or ${column} like ${descendantPattern})`;
};
