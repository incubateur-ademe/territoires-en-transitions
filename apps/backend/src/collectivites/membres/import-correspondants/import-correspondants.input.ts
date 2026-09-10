import { z } from 'zod';

/**
 * Le nombre d'envois qu'un même fichier peut déclencher en un passage. Une
 * campagne se compte en dizaines : au-delà, c'est un fichier qui a dérapé.
 */
export const MAX_ENVOIS_PAR_PASSAGE = 200;

export const importCorrespondantsInputSchema = z.object({
  /** Le contenu du CSV. Le fichier vit dans le dépôt, pas dans l'image du backend. */
  contenuCsv: z.string().min(1),
  /**
   * L'adresse du membre de l'équipe qui joue l'import : elle signe les
   * invitations créées (`created_by`), et n'apparaît jamais dans le message.
   */
  initiateurEmail: z.email({ pattern: z.regexes.unicodeEmail }),
  /** Rien n'est écrit ni envoyé tant que l'envoi n'est pas demandé. */
  mode: z.enum(['a-blanc', 'envoi']).prefault('a-blanc'),
});

export type ImportCorrespondantsInput = z.infer<
  typeof importCorrespondantsInputSchema
>;
