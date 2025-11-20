import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { integer, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';

export const collectiviteBucketTable = pgTable(
  'collectivite_bucket',
  {
    bucketId: text('bucket_id').notNull(), // TODO references storage.buckets
    collectiviteId: integer('collectivite_id').references(
      () => collectiviteTable.id
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.bucketId, table.collectiviteId] }),
    };
  }
);
