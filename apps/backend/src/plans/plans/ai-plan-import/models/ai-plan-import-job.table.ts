import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { createdAt, modifiedAt } from '@tet/backend/utils/column.utils';
import { InferSelectModel } from 'drizzle-orm';
import { integer, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { StepStates } from '../generate-import-draft/run-import-pipeline';
import { PlanDraft } from './plan-draft';

export enum AiPlanImportJobStatusEnum {
  PENDING = 'pending',
  RUNNING = 'running',
  DONE = 'done',
  FAILED = 'failed',
}

const orderedAiPlanImportJobStatus = [
  AiPlanImportJobStatusEnum.PENDING,
  AiPlanImportJobStatusEnum.RUNNING,
  AiPlanImportJobStatusEnum.DONE,
  AiPlanImportJobStatusEnum.FAILED,
] as const;

export const aiPlanImportJobStatusSchema = z.enum(orderedAiPlanImportJobStatus);

export type AiPlanImportJobStatus = z.infer<typeof aiPlanImportJobStatusSchema>;

export const aiPlanImportJobInFlightStatuses: readonly AiPlanImportJobStatus[] =
  [AiPlanImportJobStatusEnum.PENDING, AiPlanImportJobStatusEnum.RUNNING];

export type AiPlanImportJobOptions = {
  withVerifications: boolean;
  withSousActions: boolean;
  disabledFields: string[];
};

export const aiPlanImportJobTable = pgTable('ai_plan_import_job', {
  id: uuid('id').primaryKey().defaultRandom(),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => authUsersTable.id, { onDelete: 'cascade' }),
  status: text('status').notNull().$type<AiPlanImportJobStatus>(),
  options: jsonb('options').notNull().$type<AiPlanImportJobOptions>(),
  stepStates: jsonb('step_states').notNull().$type<StepStates>(),
  sourcePath: text('source_path').notNull(),
  draft: jsonb('draft').$type<PlanDraft>(),
  error: text('error'),
  createdAt,
  modifiedAt,
});

export type AiPlanImportJob = InferSelectModel<typeof aiPlanImportJobTable>;
