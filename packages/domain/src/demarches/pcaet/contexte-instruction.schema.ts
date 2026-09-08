import * as z from 'zod/mini';
import { pcaetPerimetreSaisineSchema } from './pcaet-perimetre-saisine.enum.schema';

/**
 * Ce qui suffit à dire « tu consultes cette collectivité au titre de ce
 * service » : la saisine qui ouvre le dossier, et le service au nom duquel on
 * la consulte — celui vers lequel la bannière ramène.
 *
 * Un agent de service n'est pas membre de la collectivité qu'il instruit : son
 * droit d'y entrer découle de cette saisine, et de rien d'autre. Le contexte est
 * donc déduit à chaque fois du côté serveur, jamais retenu dans une session — il
 * survit ainsi à un rechargement comme à un lien partagé, et disparaît de
 * lui-même quand la saisine n'existe plus.
 */
export const contexteInstructionSchema = z.object({
  demandeAvisId: z.number(),
  instructeur: z.object({
    collectiviteId: z.number(),
    nom: z.string(),
  }),
  /**
   * Le territoire de la déposante qui vaut cette saisine.
   *
   * Le fait, et non sa conséquence : « ne dépose pas d'avis » est vrai d'une DDT
   * sur son propre département comme d'une DREAL voisine, et ces deux-là n'ont
   * pas à lire la même chose à l'écran. Seule la seconde est là parce qu'un EPCI
   * déborde chez elle.
   *
   * La question se pose par dossier et non par service : une DREAL est
   * principale sur celui de sa région et secondaire sur celui de l'EPCI voisin.
   */
  perimetre: pcaetPerimetreSaisineSchema,
});

export type ContexteInstruction = z.infer<typeof contexteInstructionSchema>;
