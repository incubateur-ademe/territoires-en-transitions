import { TIMESTAMP_OPTIONS } from '@/domain/utils';
import { pgTable, timestamp } from 'drizzle-orm/pg-core';
import { DocumentBase } from './document.basetable';

export const preuveRapportTable = pgTable('preuve_rapport', {
  ...DocumentBase,
  date: timestamp('date', TIMESTAMP_OPTIONS).notNull(),
});
