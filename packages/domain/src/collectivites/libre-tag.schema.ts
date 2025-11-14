import z from 'zod';

export const libreTagSchema = z.object({
  id: z.number(),
  nom: z.string(),
  collectiviteId: z.number(),
  createdAt: z.string().nullable(),
  createdBy: z.string().uuid().nullable(),
});

export type LibreTag = z.infer<typeof libreTagSchema>;

