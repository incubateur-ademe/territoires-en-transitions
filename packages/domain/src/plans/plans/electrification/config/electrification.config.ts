import * as z from 'zod/mini';
import { electrificationFichesConfigSchema } from './electrification-fiches.config';
import { indicateurPeriodiciteSchema } from '../../../../indicateurs/indicateur/indicateur-periodicite.schema';
import { nonBlankTextSchema } from '../../../../shared/non-blank-text.schema';

export const electrificationConfigSchema = z.object({
  version: nonBlankTextSchema,
  // Absent uniquement sur les snapshots antérieurs aux définitions importables.
  engagementsFormat: z.optional(z.literal(2)),
  source: z.optional(z.url()),
  fiches: electrificationFichesConfigSchema,
  axes: z.array(
    z.object({
      numero: z.int().check(z.positive()),
      titre: z.string().check(z.minLength(1)),
    })
  ),
  // null signifie que la correspondance métier n'a pas encore été livrée.
  sousAxes: z.nullable(
    z.array(
      z.object({
        numero: z.string().check(z.minLength(1)),
        axeNumero: z.int().check(z.positive()),
        titre: z.string().check(z.minLength(1)),
      })
    )
  ),
  engagements: z.array(
    z.object({
      code: z.string().check(z.minLength(1)),
      libelleSource: z.optional(nonBlankTextSchema),
      axeNumero: z.int().check(z.positive()),
      actionTitre: z.nullable(z.string().check(z.minLength(1))),
      cibles: z.array(
        z.object({
          key: z.string().check(z.minLength(1)),
          libelleSource: z.optional(nonBlankTextSchema),
          // Unité attendue dans le brouillon, déclarée par la référence externe.
          // Obligatoire avec reglesImport dans les nouveaux catalogues.
          uniteImport: z.optional(nonBlankTextSchema),
          reglesImport: z.optional(
            z.object({
              annee: z.int().check(z.minimum(1000), z.maximum(9999)),
              minimum: z.nullable(z.number()),
              maximum: z.nullable(z.number()),
              plafondCible: z.nullable(nonBlankTextSchema),
              libelles: z.array(nonBlankTextSchema),
              unites: z.array(nonBlankTextSchema),
            })
          ),
          // Une cible sans correspondance publiée reste explicitement en attente.
          identifiantReferentiel: z.nullable(nonBlankTextSchema),
          unite: z.nullable(nonBlankTextSchema),
          periodicite: z.nullable(indicateurPeriodiciteSchema),
          validation: z.enum(['pending', 'validated']),
        })
      ),
    })
  ),
});

export type ElectrificationConfig = z.infer<typeof electrificationConfigSchema>;
