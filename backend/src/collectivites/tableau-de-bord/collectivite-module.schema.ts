import z from 'zod';
import {
  createModuleFicheActionCountBySchema,
  moduleFicheActionCountBySchema,
} from './module-fiche-action-count-by.schema';
import {
  createModulePlanActionListSchema,
  modulePlanActionListSchema,
} from './module-plan-action-list.schema';

export const collectiviteModuleSchema = z.discriminatedUnion('type', [
  moduleFicheActionCountBySchema,
  modulePlanActionListSchema,
]);

export const createCollectiviteModuleSchema = z.discriminatedUnion('type', [
  createModuleFicheActionCountBySchema,
  createModulePlanActionListSchema,
]);

export type CollectiviteModuleType = z.infer<typeof collectiviteModuleSchema>;

export type CreateCollectiviteModuleType = z.infer<
  typeof createCollectiviteModuleSchema
>;
