import * as z from 'zod/mini';

export const labellisationBibliothequeFichierSchema = z.object({
  id: z.number(),
  collectiviteId: z.nullable(z.number()),
  hash: z.nullable(z.string()),
  filename: z.nullable(z.string()),
  confidentiel: z.boolean(),
});

export type LabellisationBibliothequeFichier = z.infer<
  typeof labellisationBibliothequeFichierSchema
>;

