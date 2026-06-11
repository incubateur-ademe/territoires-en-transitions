import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { createdAt, modifiedAt } from '@tet/backend/utils/column.utils';
import { InferSelectModel, sql } from 'drizzle-orm';
import {
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { createEnumObject } from '@tet/domain/utils';
import { z } from 'zod';
import { StepStates } from '../generate-import-draft/run-import-pipeline';
import { DisableableField } from './disableable-field';
import { PlanDraft } from './plan-draft';

const aiPlanImportJobStatusValues = [
  'pending',
  'running',
  'done',
  'failed',
] as const;

export const AiPlanImportJobStatusEnum = createEnumObject(
  aiPlanImportJobStatusValues
);

export const aiPlanImportJobStatusSchema = z.enum(aiPlanImportJobStatusValues);

export type AiPlanImportJobStatus = z.infer<typeof aiPlanImportJobStatusSchema>;

export const aiPlanImportJobInFlightStatuses: AiPlanImportJobStatus[] = [
  AiPlanImportJobStatusEnum.PENDING,
  AiPlanImportJobStatusEnum.RUNNING,
];

export type AiPlanImportJobOptions = {
  instructions: string;
  withVerifications: boolean;
  withSousActions: boolean;
  disabledFields: DisableableField[];
};

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

export type AiPlanImportJob = InferSelectModel<typeof aiPlanImportJobTable>;
