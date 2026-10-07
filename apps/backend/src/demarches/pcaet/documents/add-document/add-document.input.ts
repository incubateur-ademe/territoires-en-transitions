import { demarcheDocumentEtapeValues } from '@tet/domain/demarches';
import { z } from 'zod';

export const addDemarchePcaetDocumentInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  /** Identifiant de la pièce attendue (cf. modèle de démarche). */
  documentId: z.string().trim().min(1),
  /**
   * Temps du dossier où déposer cette version. Facultatif : sans précision, la
   * pièce est déposée au temps où elle est exigée — seule une pièce de portée
   * `both` a une reprise à distinguer de sa version transmise.
   */
  etape: z.enum(demarcheDocumentEtapeValues).optional(),
  /** Fichier de la bibliothèque de la collectivité à rattacher. */
  fichierId: z.number().int().positive(),
  commentaire: z.string().optional(),
});

export type AddDemarchePcaetDocumentInput = z.infer<
  typeof addDemarchePcaetDocumentInputSchema
>;
