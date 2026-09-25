import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { enjeuEnumValues, analysisStepEnumValues } from '@tet/domain/shared';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { createdAt, modifiedAt } from '@tet/backend/utils/column.utils';
import { sql } from 'drizzle-orm';
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { ClassificationReport } from './classification-report';
import {
  analysisJobInFlightStatuses,
  analysisJobStatusValues,
} from './analysis-job';

export const enjeuEnum = pgEnum('enjeu', enjeuEnumValues);

export const inFlightStatusPredicate = sql.raw(
  `status in (${analysisJobInFlightStatuses
    .map((status) => `'${status}'`)
    .join(', ')})`
);

export const analysisJobTable = pgTable(
  'analyse_volets_job',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => authUsersTable.id, { onDelete: 'cascade' }),
    enjeu: enjeuEnum('enjeu').notNull(),
    etape: text('etape', { enum: analysisStepEnumValues }).notNull(),
    status: text('status', {
      enum: analysisJobStatusValues,
    }).notNull(),
    processedBatches: integer('processed_batches').notNull().default(0),
    totalBatches: integer('total_batches').notNull().default(0),
    report: jsonb('report').$type<ClassificationReport>(),
    tokenUsage: jsonb('token_usage').$type<TokenUsage>(),
    error: text('error'),
    createdAt,
    modifiedAt,
  },
  (table) => [
    uniqueIndex('analyse_volets_job_in_flight_unique')
      .on(table.collectiviteId, table.enjeu)
      .where(inFlightStatusPredicate),
  ]
);
