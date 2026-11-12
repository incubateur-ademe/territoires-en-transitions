import { personneIdSchema } from '@tet/domain/collectivites';
import { demarchePcaetObligationValues } from '@tet/domain/demarches';
import { z } from 'zod';

// Large au-dessus des plus grands Supras (quelques dizaines de membres) : la
// borne ne sert qu'à refuser une requête démesurée.
const COLLECTIVITES_COUVERTES_MAX = 100;

export const createDemarchePcaetInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  titre: z.string().optional(),
  description: z.string().optional(),
  obligation: z.enum(demarchePcaetObligationValues).optional(),
  launchedAt: z.iso.datetime({ offset: true }).nullish(),
  pilotes: z.array(personneIdSchema).optional(),
  /**
   * Le PCAET a déjà été transmis pour avis hors de la plateforme : la démarche
   * démarre alors à l'étape de finalisation, sans circuit d'avis. Choix figé —
   * aucune route ne le modifie ensuite.
   */
  transmittedOffPlatform: z.boolean().optional(),
  /**
   * Le PCAET est porté par un SCoT-AEC (document unique valant SCoT et PCAET).
   * Déclaratif : n'ouvre aucun droit, et n'est pas vérifié contre la compétence
   * Banatic 5500 — celle-ci décide seulement si la question est posée à
   * l'écran. Refuser la valeur au motif que la ligne Banatic manque
   * fabriquerait une impasse pour une collectivité légitime.
   */
  isScotAec: z.boolean().optional(),
  /**
   * EPCI à fiscalité propre couverts par le PCAET, quand la collectivité est un
   * Supra. Chacun doit être l'un de ses membres d'après BANATIC. Fixé à la
   * création : aucune route ne le modifie ensuite.
   */
  collectivitesCouvertesIds: z
    .array(z.number().int().positive())
    .max(COLLECTIVITES_COUVERTES_MAX)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Une collectivité couverte apparaît deux fois',
    })
    .optional(),
});

export type CreateDemarchePcaetInput = z.infer<
  typeof createDemarchePcaetInputSchema
>;
