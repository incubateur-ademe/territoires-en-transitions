import { jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { ElectrificationDataKind } from './publish-electrification-data.input';

/** Sélection technique des fichiers immuables publiés dans Storage. */
export const electrificationDataSelectionTable = pgTable(
  'electrification_data_selection',
  {
    kind: text('kind').$type<ElectrificationDataKind>().primaryKey(),
    version: text('version').notNull(),
    revision: uuid('revision').defaultRandom().notNull(),
    metadata: jsonb('metadata').$type<Record<string, string>>().notNull(),
  }
);
