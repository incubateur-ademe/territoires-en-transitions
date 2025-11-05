import z from 'zod';
import {
  moduleFicheActionCountBySchema,
  moduleFicheCountBySchemaCreate,
} from './module-fiche-action-count-by.schema';
import {
  modulePlanActionListSchema,
  modulePlanActionListSchemaCreate,
} from './module-plan-action-list.schema';

export const collectiviteModuleSchema = z.discriminatedUnion('type', [
  moduleFicheActionCountBySchema,
  modulePlanActionListSchema,
]);

export const collectiviteModuleSchemaCreate = z.discriminatedUnion('type', [
  moduleFicheCountBySchemaCreate,
  modulePlanActionListSchemaCreate,
]);

export type CollectiviteModule = z.infer<typeof collectiviteModuleSchema>;

export type CollectiviteModuleCreate = z.infer<
  typeof collectiviteModuleSchemaCreate
>;
