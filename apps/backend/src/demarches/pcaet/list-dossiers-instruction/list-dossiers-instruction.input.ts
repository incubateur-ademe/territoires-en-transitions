import {
  collectivitePcaetObligationSchema,
  pcaetStatutInstructionSchema,
  STATUTS_INSTRUCTION_PAR_DEFAUT,
} from '@tet/domain/demarches';
import { z } from 'zod';

export const listDossiersInstructionSortValues = [
  'priorite',
  'echeance',
  'dateSaisine',
  'dateAdoption',
  'collectivite',
  'pilote',
  'statut',
] as const;

export type ListDossiersInstructionSort =
  (typeof listDossiersInstructionSortValues)[number];

export const listDossiersInstructionInputSchema = z.object({
  /** Le service instructeur dont on liste le territoire. */
  collectiviteId: z.number().int().positive(),
  /**
   * Les statuts retenus :
   *
   * - champ absent : le défaut du domaine, partagé avec l'écran ;
   * - liste vide : aucun filtre, tous les statuts. C'est ce que dit
   *   « Désélectionner les options » ;
   * - liste garnie : ces statuts-là.
   */
  statuts: z
    .array(pcaetStatutInstructionSchema)
    .prefault([...STATUTS_INSTRUCTION_PAR_DEFAUT]),
  obligations: z.array(collectivitePcaetObligationSchema).optional(),
  /**
   * Filtre par région de la collectivité déposante. N'a de sens que pour un
   * service qui en couvre plusieurs : un national, ou la DR ADEME Océan Indien
   * et son périmètre secondaire.
   */
  regionCodes: z.string().array().optional(),
  /**
   * Filtre par département du siège de la collectivité déposante : une DREAL
   * suit ses dossiers département par département.
   */
  departementCodes: z.string().array().optional(),
  /**
   * Les collectivités choisies parmi les suggestions de recherche. Un porteur
   * choisi garde tout son groupe ; un EPCI couvert choisi ramène le dépôt de son
   * Supra, avec lui seul en sous-ligne.
   */
  collectiviteIds: z.number().int().positive().array().optional(),
  /**
   * Nom, même partiel, d'une collectivité ou de la structure porteuse. Sans
   * égard aux accents ni à la ponctuation ; à défaut de nom qui la contienne,
   * avec quelques fautes de frappe tolérées — voir `isRechercheApprochee`.
   */
  recherche: z.string().trim().min(1).optional(),
  /**
   * Par défaut, la priorité : les dossiers en instruction d'abord. Ce n'est le
   * tri d'aucune colonne, et `direction` n'y change rien — voir
   * `trierDossiers`.
   */
  sort: z.enum(listDossiersInstructionSortValues).prefault('priorite'),
  direction: z.enum(['asc', 'desc']).prefault('desc'),
  page: z.coerce.number().int().min(1).prefault(1),
  limit: z.coerce.number().int().min(1).max(200).prefault(25),
});

export type ListDossiersInstructionInput = z.infer<
  typeof listDossiersInstructionInputSchema
>;
