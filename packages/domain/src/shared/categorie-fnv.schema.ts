import z from 'zod';

export const categorieFNVSchema = z.object({
  id: z.number(),
  nom: z.string(),
});

export type CategorieFNVType = z.infer<typeof categorieFNVSchema>;

