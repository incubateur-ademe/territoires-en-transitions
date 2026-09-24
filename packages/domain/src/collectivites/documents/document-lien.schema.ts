import * as z from 'zod/mini';

export const lienSchema = z.object({
  url: z.string(),
  titre: z.string(),
});

export type Lien = z.infer<typeof lienSchema>;

export const lienInputSchema = z.object({
  url: z.url(),
  titre: z.string().check(z.minLength(1)),
});
