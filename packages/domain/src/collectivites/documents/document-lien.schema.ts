import * as z from 'zod/mini';

export const lienSchema = z.object({
  url: z.string(),
  titre: z.string(),
});

export type Lien = z.infer<typeof lienSchema>;

export const LIEN_URL_PROTOCOLS = /^https?$/;

export const lienInputSchema = z.object({
  url: z.url({ protocol: LIEN_URL_PROTOCOLS }),
  titre: z.string().check(z.trim(), z.minLength(1)),
});
