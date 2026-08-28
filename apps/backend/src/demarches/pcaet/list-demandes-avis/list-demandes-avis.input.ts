import { pcaetDemandeAvisEtatSchema } from '@tet/domain/demarches';
import { z } from 'zod';

export const listDemandesAvisSortValues = [
  'echeance',
  'collectivite',
  'contact',
  'statut',
] as const;

export const listDemandesAvisInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  etats: z.array(pcaetDemandeAvisEtatSchema).optional(),
  departementCodes: z.string().array().optional(),
  recherche: z.string().trim().min(1).optional(),
  sort: z.enum(listDemandesAvisSortValues).prefault('echeance'),
  /**
   * Échéance décroissante par défaut : l'échéance étant la transmission plus le
   * délai légal, les dossiers arrivés le plus récemment remontent en tête.
   */
  direction: z.enum(['asc', 'desc']).prefault('desc'),
  page: z.coerce.number().int().min(1).prefault(1),
  limit: z.coerce.number().int().min(1).max(200).prefault(25),
});

export type ListDemandesAvisInput = z.infer<typeof listDemandesAvisInputSchema>;
