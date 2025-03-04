import { integer } from 'drizzle-orm/pg-core';
import { collectiviteTable } from './index-domain';

export const collectiviteId = {
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
};
