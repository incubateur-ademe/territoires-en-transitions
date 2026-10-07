import { z } from 'zod';

/**
 * Ce qui désigne un dossier lu par un service.
 *
 * Sa saisine, une fois le dossier transmis : c'est elle qui ouvre le dossier.
 * La démarche elle-même tant qu'il ne l'est pas : un dépôt en élaboration n'a
 * saisi personne, et le service le lit au titre de son périmètre. Deux clés
 * pour un même écran, plutôt qu'une saisine fictive posée avant l'heure.
 */
export const dossierInstructionRefSchema = z.union([
  z.object({ demandeAvisId: z.number().int().positive() }),
  z.object({ demarcheId: z.number().int().positive() }),
]);

export type DossierInstructionRef = z.infer<typeof dossierInstructionRefSchema>;
