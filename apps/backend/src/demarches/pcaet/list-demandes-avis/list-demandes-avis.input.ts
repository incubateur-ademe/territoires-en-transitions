import { pcaetDemandeAvisEtatValues } from '@tet/domain/demarches';
import { z } from 'zod';

export const listDemandesAvisSortValues = [
  'echeance',
  'collectivite',
  'contact',
  'statut',
] as const;

export const listDemandesAvisInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  etats: z.enum(pcaetDemandeAvisEtatValues).array().optional(),
  departementCodes: z.string().array().optional(),
  recherche: z.string().trim().min(1).optional(),
  sort: z.enum(listDemandesAvisSortValues).prefault('echeance'),
  direction: z.enum(['asc', 'desc']).prefault('asc'),
  page: z.coerce.number().int().min(1).prefault(1),
  limit: z.coerce.number().int().min(1).max(200).prefault(25),
});

export type ListDemandesAvisInput = z.infer<typeof listDemandesAvisInputSchema>;
