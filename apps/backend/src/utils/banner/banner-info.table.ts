import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { modifiedAt, modifiedBy } from '@tet/backend/utils/column.utils';
import type { BannerType } from '@tet/domain/utils';
import { boolean, integer, pgTable, text } from 'drizzle-orm/pg-core';

export const bannerInfoTable = pgTable('banner_info', {
  // Singleton: always 1. The DB CHECK + DEFAULT keeps the table at exactly
  // one row, enabling INSERT ... ON CONFLICT (id) DO UPDATE for atomic upsert.
  id: integer('id').primaryKey().notNull().default(1),
  type: text('type').$type<BannerType>().notNull(),
  info: text('info').notNull().default(''),
  modifiedAt,
  modifiedBy: modifiedBy.references(() => dcpTable.id, {
    onDelete: 'set null',
  }),
  active: boolean('active').notNull().default(false),
});
