import {
  demarcheDocumentsSnapshotSchema,
  demarchePcaetStatusSchema,
  pcaetAvisAuTitreDeSchema,
  pcaetDemandeAvisEtatSchema,
} from '@tet/domain/demarches';
import { z } from 'zod';
import { demarchePlanContenuSchema } from '@tet/backend/demarches/shared/models/demarche-plan-contenu.dto';
import { pcaetAvisSchema } from '../shared/models/pcaet-avis.dto';

export const dossierInstructionSchema = z.object({
  demandeAvisId: z.number().int(),
  demarcheId: z.number().int(),
  titre: z.string(),
  status: demarchePcaetStatusSchema,
  etat: pcaetDemandeAvisEtatSchema,
  transmittedAt: z.string().nullable(),
  avisDeadlineAt: z.string().nullable(),
  /**
   * Date du dernier avis validé sur cette demande — nulle tant qu'aucun ne
   * l'est. C'est elle qui remplace l'échéance à l'écran une fois l'instruction
   * faite : l'échéance n'a plus rien à dire.
   */
  instruitLe: z.string().nullable(),
  /**
   * Les titres au nom desquels cette collectivité peut se prononcer sur ce
   * dossier : deux pour la DREAL, un pour le conseil régional, aucun pour un
   * destinataire en lecture comme la DDT. L'écran lit cette liste plutôt que de
   * déduire un droit d'un type — et n'a jamais à proposer un titre que le
   * serveur refuserait.
   */
  titresDeposables: z.array(pcaetAvisAuTitreDeSchema),
  launchedAt: z.string().nullable(),
  createdAt: z.string(),
  modifiedAt: z.string(),
  pilotes: z.string().array(),
  collectivite: z.object({
    id: z.number().int(),
    nom: z.string(),
  }),
  documents: demarcheDocumentsSnapshotSchema,
  /**
   * Programme d'actions rattaché, en lecture seule : l'instructeur n'a aucun
   * droit sur les plans de la collectivité déposante, il ne peut donc pas les
   * lire par les routes `plans`.
   */
  plans: demarchePlanContenuSchema.array(),
  /**
   * Avis déjà déposés sur cette demande, un par titre au maximum. L'instructeur
   * les lit pour information — et le titre d'un avis déjà rendu ne lui est plus
   * proposé à la finalisation.
   */
  avis: pcaetAvisSchema.array(),
});

export type DossierInstruction = z.infer<typeof dossierInstructionSchema>;
