import * as z from 'zod/mini';

export const importIndicateurReferenceSchema = z
  .object({
    identifiantReferentiel: z.optional(
      z.string().check(z.trim(), z.minLength(1))
    ),
    source: z.string().check(z.trim(), z.minLength(1)),
    codeExterne: z.string().check(z.trim(), z.minLength(1)),
    lienSource: z.url().check(z.trim()),
    libelleSource: z.optional(z.string().check(z.trim(), z.minLength(1))),
    uniteImport: z.optional(z.string().check(z.trim(), z.minLength(1))),
    typeImport: z.optional(z.enum(['action', 'cibles'])),
    ciblesImport: z.optional(z.string().check(z.trim(), z.minLength(1))),
    anneeCible: z.optional(z.int().check(z.minimum(1000), z.maximum(9999))),
    valeurMin: z.optional(z.number()),
    valeurMax: z.optional(z.number()),
    plafondCible: z.optional(z.string().check(z.trim(), z.minLength(1))),
    libellesCible: z.optional(z.string().check(z.trim(), z.minLength(1))),
    unitesAcceptees: z.optional(z.string().check(z.trim(), z.minLength(1))),
  })
  .check(
    z.refine(
      ({ valeurMin, valeurMax }) =>
        valeurMin === undefined ||
        valeurMax === undefined ||
        valeurMin <= valeurMax,
      {
        path: ['valeurMax'],
        message:
          'La borne maximale doit être supérieure ou égale à la borne minimale.',
      }
    )
  );

export type ImportIndicateurReference = z.infer<
  typeof importIndicateurReferenceSchema
>;

export const indicateurReferencesSheet = {
  range: "'Références externes'!A:P",
  headers: Object.keys(importIndicateurReferenceSchema.shape),
} as const;
