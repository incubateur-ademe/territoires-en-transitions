import { listFichesRequestFiltersSchema } from '@/backend/plans/fiches/shared/filters/filters.request';
import { ficheSchema } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { updateFicheRequestSchema } from '@/backend/plans/fiches/update-fiche/update-fiche.request';
import z from 'zod';

// Utility function to create a sub-schema for array field in the input body
function listSchema<T extends z.ZodTypeAny>(schema: T) {
  return z
    .object({
      add: schema.optional(),
      remove: schema.optional(),
    })
    .optional();
}

const commonFields = z.object({
  collectiviteId: z.coerce.number(),
  statut: ficheSchema.shape.statut.optional(),
  priorite: ficheSchema.shape.priorite.optional(),
  dateFin: ficheSchema.shape.dateFin.optional(),
  ameliorationContinue: ficheSchema.shape.ameliorationContinue.optional(),
  sharedWithCollectivites: listSchema(
    updateFicheRequestSchema.shape.sharedWithCollectivites.unwrap().unwrap()
  ),
  pilotes: listSchema(updateFicheRequestSchema.shape.pilotes.unwrap().unwrap()),
  libreTags: listSchema(
    updateFicheRequestSchema.shape.libreTags.unwrap().unwrap()
  ),
});

export const bulkEditRequestSchema = z.union([
  commonFields.extend({
    ficheIds: z.literal('all'),
    filters: listFichesRequestFiltersSchema,
  }),
  commonFields.extend({
    ficheIds: ficheSchema.shape.id.array(),
  }),
]);

export type BulkEditRequest = z.infer<typeof bulkEditRequestSchema>;
