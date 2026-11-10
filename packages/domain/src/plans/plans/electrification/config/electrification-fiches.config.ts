import * as z from 'zod/mini';
import { lienInputSchema } from '../../../../collectivites/documents/document-lien.schema';
import { indicateurPeriodiciteSchema } from '../../../../indicateurs/indicateur/indicateur-periodicite.schema';
import { nonBlankTextSchema } from '../../../../shared/non-blank-text.schema';
import { ficheImportFieldsSchema } from '../../../fiches/fiche-import.schema';
import { ficheSchema } from '../../../fiches/fiche.schema';

const referenceSchema = z.object({
  code: nonBlankTextSchema,
  validation: z.enum(['pending', 'validated']),
});

export const electrificationFichesConfigSchema = z.object({
  // null : correspondances métier non livrées ; [] : catalogue validé vide.
  actions: z.nullable(
    z.array(
      z.object({
        ...referenceSchema.shape,
        axeNumero: z.int().check(z.positive()),
        sousAxeNumero: z.nullable(nonBlankTextSchema),
        champs: ficheImportFieldsSchema,
        sousActions: z.array(
          z.object({
            code: nonBlankTextSchema,
            champs: ficheImportFieldsSchema,
          })
        ),
        indicateurCodes: z.array(nonBlankTextSchema),
        // Une URL absente reste explicite tant que son traitement n'est pas décidé.
        aides: z.array(
          z.object({
            ...lienInputSchema.shape,
            url: z.nullable(lienInputSchema.shape.url),
          })
        ),
      })
    )
  ),
  indicateurs: z.nullable(
    z.array(
      z.discriminatedUnion('type', [
        z.object({
          ...referenceSchema.shape,
          type: z.literal('quantitatif'),
          identifiantReferentiel: z.nullable(nonBlankTextSchema),
          unite: z.nullable(nonBlankTextSchema),
          periodicite: z.nullable(indicateurPeriodiciteSchema),
        }),
        z.object({
          ...referenceSchema.shape,
          type: z.literal('booleen'),
          titre: ficheSchema.shape.titre.unwrap().trim().min(1),
        }),
      ])
    )
  ),
});
export type ElectrificationFichesConfig = z.infer<
  typeof electrificationFichesConfigSchema
>;
