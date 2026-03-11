import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export const findCollectiviteIdBySiren = async (
  db: NodePgDatabase,
  siren: string
): Promise<number | null> => {
  const [row] = await db
    .select({ id: collectiviteTable.id })
    .from(collectiviteTable)
    .where(eq(collectiviteTable.siren, siren))
    .limit(1);
  return row?.id ?? null;
};
