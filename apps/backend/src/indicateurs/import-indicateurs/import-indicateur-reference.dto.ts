import * as z from 'zod/mini';

export const importIndicateurReferenceSchema = z.object({
  identifiantReferentiel: z.optional(
    z.string().check(z.trim(), z.minLength(1))
  ),
  source: z.string().check(z.trim(), z.minLength(1)),
  codeExterne: z.string().check(z.trim(), z.minLength(1)),
  lienSource: z.url().check(z.trim()),
});

export type ImportIndicateurReference = z.infer<
  typeof importIndicateurReferenceSchema
>;

export const indicateurReferencesSheet = {
  range: "'Références externes'!A:F",
  headers: Object.keys(importIndicateurReferenceSchema.shape),
} as const;
