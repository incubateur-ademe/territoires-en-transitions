import * as z from 'zod/mini';
import { nonBlankTextSchema } from '../../shared/non-blank-text.schema';

export const electrificationLaureatsConfigSchema = z.object({
  source: nonBlankTextSchema,
  version: nonBlankTextSchema,
  validFrom: z.iso.datetime(),
  validUntil: z.iso.datetime(),
  laureats: z.array(
    z.object({
      reference: nonBlankTextSchema,
      collectiviteId: z.int().check(z.positive()),
    })
  ),
});

export type ElectrificationLaureatsConfig = z.infer<
  typeof electrificationLaureatsConfigSchema
>;

/**
 * Liste complète des lauréats et de leurs collectivités TeT, validée par le métier.
 * null indique que le mapping n'a pas été livré ; une liste vide valide signifie
 * qu'aucune collectivité n'est éligible. Aucune sélection de déploiement ici.
 */
export const electrificationLaureatsConfig: ElectrificationLaureatsConfig | null =
  null;
