import { TIMESTAMP_OPTIONS } from '@tet/backend/utils/column.utils';
import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { aiPlanImportJobTable } from './ai-plan-import-job.table';
import { importStepRunStatusValues } from './import-step-run';

export const aiPlanImportStepRunTable = pgTable(
  'ai_plan_import_step_run',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => aiPlanImportJobTable.id, { onDelete: 'cascade' }),
    step: text('step').notNull(),
    status: text('status', { enum: importStepRunStatusValues }).notNull(),
    startedAt: timestamp('started_at', TIMESTAMP_OPTIONS).notNull(),
    endedAt: timestamp('ended_at', TIMESTAMP_OPTIONS).notNull(),
    durationMs: integer('duration_ms').notNull(),
    llmCalls: integer('llm_calls').notNull().default(0),
    failedCalls: integer('failed_calls').notNull().default(0),
    rateLimitedCalls: integer('rate_limited_calls').notNull().default(0),
    tokens: jsonb('tokens').notNull().$type<TokenUsage>(),
    models: text('models').array().notNull().default([]),
    details: jsonb('details')
      .notNull()
      .$type<Record<string, number>>()
      .default({}),
    error: text('error'),
  },
  (table) => [
    unique('ai_plan_import_step_run_job_step_unique').on(
      table.jobId,
      table.step
    ),
  ]
);
