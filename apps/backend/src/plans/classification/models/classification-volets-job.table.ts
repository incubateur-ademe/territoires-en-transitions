import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { enjeuEnumValues, etapeAnalyseEnumValues } from '@tet/domain/shared';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
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
import { ClassificationDraft } from './classification-draft';
import {
  classificationVoletsJobInFlightStatuses,
  classificationVoletsJobStatusValues,
} from './classification-volets-job';

export const enjeuEnum = pgEnum('enjeu', enjeuEnumValues);

export const inFlightStatusPredicate = sql.raw(
  `status in (${classificationVoletsJobInFlightStatuses
    .map((status) => `'${status}'`)
    .join(', ')})`
);

export const classificationVoletsJobTable = pgTable(
  'classification_volets_job',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => authUsersTable.id, { onDelete: 'cascade' }),
    enjeu: enjeuEnum('enjeu').notNull(),
    etape: text('etape', { enum: etapeAnalyseEnumValues }).notNull(),
    status: text('status', {
      enum: classificationVoletsJobStatusValues,
    }).notNull(),
    processedBatches: integer('processed_batches').notNull().default(0),
    totalBatches: integer('total_batches').notNull().default(0),
    draft: jsonb('draft').$type<ClassificationDraft>(),
    tokenUsage: jsonb('token_usage').$type<TokenUsage>(),
    error: text('error'),
    createdAt,
    modifiedAt,
  },
  (table) => [
    uniqueIndex('classification_volets_job_in_flight_unique')
      .on(table.collectiviteId, table.enjeu)
      .where(inFlightStatusPredicate),
  ]
);
