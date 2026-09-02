import * as z from 'zod/mini';

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
});

export type ContexteInstruction = z.infer<typeof contexteInstructionSchema>;
