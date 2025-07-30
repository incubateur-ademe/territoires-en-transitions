import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { integer } from 'drizzle-orm/pg-core';

export const collectiviteId = {
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
};
