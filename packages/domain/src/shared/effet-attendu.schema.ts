import z from 'zod';

export const effetAttenduSchema = z.object({
  id: z.number(),
  nom: z.string(),
  notice: z.string().nullable(),
});

export type EffetAttendu = z.infer<typeof effetAttenduSchema>;

