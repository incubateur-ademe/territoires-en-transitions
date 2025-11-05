import z from 'zod';

export const partenaireTagSchema = z.object({
  id: z.number(),
  nom: z.string(),
  collectiviteId: z.number(),
});

export type PartenaireTag = z.infer<typeof partenaireTagSchema>;

