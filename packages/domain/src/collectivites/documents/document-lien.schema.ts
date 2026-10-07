import * as z from 'zod/mini';
import { nonBlankTextSchema } from '../../shared/non-blank-text.schema';

export const lienSchema = z.object({
  url: z.string(),
  titre: z.string(),
});

export type Lien = z.infer<typeof lienSchema>;

export const LIEN_URL_PROTOCOLS = /^https?$/;

export const lienInputSchema = z.object({
  url: z.url({ protocol: LIEN_URL_PROTOCOLS }),
  titre: nonBlankTextSchema,
});
