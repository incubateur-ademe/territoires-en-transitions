import z from 'zod';

export const sousThematiqueSchema = z.object({
  id: z.number(),
  nom: z.string(),
  thematiqueId: z.number(),
});

export type SousThematique = z.infer<typeof sousThematiqueSchema>;

