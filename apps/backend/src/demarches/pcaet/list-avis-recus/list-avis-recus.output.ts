import { pcaetAvisAuTitreDeSchema } from '@tet/domain/demarches';
import { z } from 'zod';

/**
 * Un avis rendu, tel que la collectivité déposante peut le lire.
 *
 * Volontairement plus étroit que le DTO de l'instructeur : ni brouillon, ni
 * auteur du dépôt, ni date de modification. Ce que la collectivité a à savoir,
 * c'est qui a rendu quoi, et quand.
 */
export const avisRecuSchema = z.object({
  id: z.string(),
  demandeAvisId: z.number().int(),
  auTitreDe: pcaetAvisAuTitreDeSchema,
  /** Au-delà d'une, les pièces se téléchargent ensemble dans une archive. */
  nombrePieces: z.number().int().nonnegative(),
  valideLe: z.string(),
  envoyeLe: z.string().nullable(),
  /** Nom de la collectivité instructrice qui a rendu l'avis. */
  instructeurNom: z.string(),
});

export type AvisRecu = z.infer<typeof avisRecuSchema>;
