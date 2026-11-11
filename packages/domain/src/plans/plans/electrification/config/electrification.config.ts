import * as z from 'zod/mini';
import { electrificationFichesConfigSchema } from './electrification-fiches.config';
import { indicateurPeriodiciteSchema } from '../../../../indicateurs/indicateur/indicateur-periodicite.schema';
import { nonBlankTextSchema } from '../../../../shared/non-blank-text.schema';

/** Identifiants internes stables du programme, indépendants des libellés du canevas. */
export const ElectrificationEngagementCodeEnum = {
  SORTIE_FIOUL_LOGEMENTS_PRIVES: 'E01',
  SORTIE_GAZ_LOGEMENTS_PRIVES: 'E02',
  DECOMMISSIONNEMENT_RESEAU_GAZ: 'E03',
  SORTIE_GAZ_LOGEMENTS_SOCIAUX: 'E04',
  SORTIE_GAZ_BATIMENTS_PUBLICS: 'E05',
  ELECTRIFICATION_VEHICULES_PARTICULIERS: 'E06',
  BORNES_RECHARGE_PUBLIQUES: 'E07',
  ELECTRIFICATION_AUTOBUS: 'E08',
  ELECTRIFICATION_ARTISANS: 'E09',
  ELECTRIFICATION_INDUSTRIE: 'E10',
  ELECTRIFICATION_AGRICULTURE: 'E11',
  SITE_RECHARGE_POIDS_LOURDS: 'E12',
} as const;

export const electrificationConfigSchema = z.object({
  version: nonBlankTextSchema,
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
      axeNumero: z.int().check(z.positive()),
      actionTitre: z.nullable(z.string().check(z.minLength(1))),
      cibles: z.array(
        z.object({
          key: z.string().check(z.minLength(1)),
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
