import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import {
  createdAt,
  createdBy,
  modifiedAt,
} from '@tet/backend/utils/column.utils';
import {
  ReportGenerationOptions,
  ReportGenerationStatus,
} from '@tet/domain/plans';
import { integer, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { axeTable } from '../../fiches/shared/models/axe.table';

export const reportGenerationTable = pgTable('plan_report_generation', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
  planId: integer('plan_id')
    .notNull()
    .references(() => axeTable.id, { onDelete: 'cascade' }),
  templateRef: text('template_ref').notNull(),
  fileId: integer('file_id').references(() => bibliothequeFichierTable.id),
  options: jsonb('options').$type<ReportGenerationOptions>(),
  status: text('status').notNull().$type<ReportGenerationStatus>(),
  errorMessage: text('error_message'),
  createdBy,
  createdAt,
  modifiedAt,
});
