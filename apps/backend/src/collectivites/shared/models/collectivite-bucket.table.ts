import { integer, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';

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
