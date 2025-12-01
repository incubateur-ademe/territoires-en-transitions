import z from 'zod';

export const structureTagSchema = z.object({
  id: z.number(),
  nom: z.string(),
  collectiviteId: z.number(),
});

export type StructureTag = z.infer<typeof structureTagSchema>;
