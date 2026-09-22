import * as z from 'zod/mini';
import { collectiviteTypeEnumSchema } from '../../collectivites/collectivite-type.enum';
import { pcaetPerimetreSaisineSchema } from './pcaet-perimetre-saisine.enum.schema';

/**
 * Ce qui suffit à dire « tu consultes cette collectivité au titre de ce
 * service » : le dossier qui ouvre la porte, et le service au nom duquel on le
 * consulte — celui vers lequel la bannière ramène.
 *
 * Un agent de service n'est pas membre de la collectivité qu'il instruit : son
 * droit d'y entrer découle de la saisine — ou, tant que le dépôt est en
 * élaboration et n'a saisi personne, du périmètre de son service — et de rien
 * d'autre. Le contexte est donc déduit à chaque fois du côté serveur, jamais
 * retenu dans une session : il survit ainsi à un rechargement comme à un lien
 * partagé, et disparaît de lui-même quand le dossier n'existe plus.
 */
export const contexteInstructionSchema = z.object({
  /**
   * La saisine par laquelle le dossier se lit. Nulle tant que le dépôt est en
   * élaboration : rien n'a encore été transmis, le service le lit au titre de
   * son périmètre, et le dossier s'adresse alors par sa démarche.
   */
  demandeAvisId: z.nullable(z.number()),
  /** La démarche consultée — toujours connue, saisine ou non. */
  demarcheId: z.number(),
  instructeur: z.object({
    collectiviteId: z.number(),
    nom: z.string(),
    /**
     * La casquette, que la bannière dit à l'agent : c'est le type du service qui
     * la nomme (« la DREAL »), pas son nom propre, déjà lisible dans le
     * sélecteur de contexte du header.
     */
    type: collectiviteTypeEnumSchema,
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
