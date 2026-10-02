import { z } from 'zod';
import type { DossierInstructionRef } from '../shared/dossier-instruction-ref.input';

/**
 * La clé du dossier en paramètres de requête : mêmes deux clés que la
 * référence tRPC, la saisine une fois transmis, la démarche avant. Un objet
 * et non une union, que la classe de DTO ne sait pas étendre : l'exclusivité
 * se vérifie à part.
 */
export const downloadDossierDocumentsQuerySchema = z
  .object({
    demandeAvisId: z.coerce.number().int().positive().optional(),
    demarcheId: z.coerce.number().int().positive().optional(),
  })
  .refine(
    ({ demandeAvisId, demarcheId }) =>
      (demandeAvisId === undefined) !== (demarcheId === undefined),
    { message: 'Renseignez soit demandeAvisId, soit demarcheId' }
  );

export type DownloadDossierDocumentsQuery = z.infer<
  typeof downloadDossierDocumentsQuerySchema
>;

export const toDossierInstructionRef = ({
  demandeAvisId,
  demarcheId,
}: DownloadDossierDocumentsQuery): DossierInstructionRef =>
  demandeAvisId !== undefined
    ? { demandeAvisId }
    : { demarcheId: demarcheId as number };
