import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { createdAt, modifiedAt } from '@tet/backend/utils/column.utils';
import { sql } from 'drizzle-orm';
import {
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { StepStates } from '../generate-import-draft/run-import-pipeline';
import {
  AiPlanImportJobOptions,
  aiPlanImportJobStatusValues,
} from './ai-plan-import-job';
import { PlanDraft } from './plan-draft';

export const aiPlanImportJobTable = pgTable(
  'ai_plan_import_job',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => authUsersTable.id, { onDelete: 'cascade' }),
    status: text('status', { enum: aiPlanImportJobStatusValues }).notNull(),
    options: jsonb('options').notNull().$type<AiPlanImportJobOptions>(),
    stepStates: jsonb('step_states').notNull().$type<StepStates>(),
    sourcePath: text('source_path').notNull(),
    draft: jsonb('draft').$type<PlanDraft>(),
    error: text('error'),
    createdAt,
    modifiedAt,
  },
  (table) => [
    uniqueIndex('ai_plan_import_job_in_flight_unique')
      .on(table.collectiviteId)
      .where(sql`status IN ('pending', 'running')`),
  ]
);
