import {
  demarcheDocumentsSnapshotSchema,
  demarchePcaetStatusSchema,
  pcaetDemandeAvisEtatSchema,
} from '@tet/domain/demarches';
import { z } from 'zod';
import { pcaetAvisSchema } from '../shared/models/pcaet-avis.dto';

const dossierInstructionFicheSchema = z.object({
  id: z.number().int(),
  titre: z.string().nullable(),
});

/**
 * Un plan et son contenu, aplati : les axes portent leur profondeur plutôt
 * qu'un arbre imbriqué, ce qui suffit à les indenter et évite au front de
 * reconstruire une hiérarchie.
 */
export const dossierInstructionPlanSchema = z.object({
  id: z.number().int(),
  nom: z.string().nullable(),
  nbFiches: z.number().int(),
  /** Fiches rattachées au plan sans passer par un axe. */
  fiches: dossierInstructionFicheSchema.array(),
  axes: z
    .object({
      id: z.number().int(),
      nom: z.string().nullable(),
      /** 1 pour un axe de premier niveau ; la racine est le plan lui-même. */
      depth: z.number().int(),
      fiches: dossierInstructionFicheSchema.array(),
    })
    .array(),
});

export type DossierInstructionPlan = z.infer<
  typeof dossierInstructionPlanSchema
>;

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
  plans: dossierInstructionPlanSchema.array(),
  /**
   * Avis déjà déposés sur cette demande, un par titre au maximum. L'instructeur
   * les lit pour information — et le titre d'un avis déjà rendu ne lui est plus
   * proposé à la finalisation.
   */
  avis: pcaetAvisSchema.array(),
});

export type DossierInstruction = z.infer<typeof dossierInstructionSchema>;
