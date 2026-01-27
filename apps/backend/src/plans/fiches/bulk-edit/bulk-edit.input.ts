import { ficheSchema, listFichesRequestFiltersSchema } from '@tet/domain/plans';
import z from 'zod';
import { updateFicheInputSchema } from '../update-fiche/update-fiche.input';

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

  ...ficheSchema
    .pick({
      statut: true,
      priorite: true,
      dateFin: true,
      ameliorationContinue: true,
    })
    .partial().shape,

  // statut: ficheSchema.shape.statut.optional(),
  // priorite: ficheSchema.shape.priorite.optional(),
  // dateFin: ficheSchema.shape.dateFin.optional(),
  // ameliorationContinue: ficheSchema.shape.ameliorationContinue.optional(),
  sharedWithCollectivites: listSchema(
    updateFicheInputSchema.shape.sharedWithCollectivites.unwrap().unwrap()
  ),
  pilotes: listSchema(updateFicheInputSchema.shape.pilotes.unwrap().unwrap()),
  referents: listSchema(
    updateFicheInputSchema.shape.referents.unwrap().unwrap()
  ),
  services: listSchema(updateFicheInputSchema.shape.services.unwrap().unwrap()),
  libreTags: listSchema(
    updateFicheInputSchema.shape.libreTags.unwrap().unwrap()
  ),
});

export type BulkEditRequestCommonFields = z.infer<typeof commonFields>;

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
