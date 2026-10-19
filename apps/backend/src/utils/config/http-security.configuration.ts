import { z } from 'zod';

/** Public HTTP URLs never carry credentials; APP_URL may include a base path. */
export const httpUrlSchema = z.url({ protocol: /^https?$/ }).refine((value) => {
  const url = URL.parse(value);
  return url !== null && !url.username && !url.password;
}, 'Une URL HTTP(S) sans identifiants est requise');

/** Exact browser origins: no wildcard, path, query or fragment. */
const httpOriginSchema = httpUrlSchema
  .refine(
    (value) => /^https?:\/\/[^/?#\s*]+$/i.test(value),
    'Une origine HTTP(S) exacte est requise, sans chemin ni identifiants'
  )
  .transform((value) => new URL(value).origin);

export const httpSecurityConfiguration = {
  // Facultatif : tools peut être utilisé sans site public associé.
  SITE_URL: z.preprocess(
    (value) => value || undefined,
    httpOriginSchema.optional()
  ),
  // Les intégrations navigateur supplémentaires sont déclarées une par une.
  HTTP_ALLOWED_ORIGINS: z
    .string()
    .prefault('')
    .transform((value) =>
      value.trim() ? value.split(',').map((origin) => origin.trim()) : []
    )
    .pipe(z.array(httpOriginSchema)),
  TRUST_PROXY_HOPS: z.coerce
    .number()
    .int()
    .min(0)
    .max(10)
    .prefault(0)
    .describe('Nombre de proxies de confiance devant le serveur HTTP'),
};
