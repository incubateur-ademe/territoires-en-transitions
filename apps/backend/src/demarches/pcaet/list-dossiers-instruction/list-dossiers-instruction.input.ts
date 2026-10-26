import {
  collectivitePcaetObligationSchema,
  pcaetStatutInstructionSchema,
  STATUTS_INSTRUCTION_PAR_DEFAUT,
} from '@tet/domain/demarches';
import { z } from 'zod';

export const listDossiersInstructionSortValues = [
  'priorite',
  'echeance',
  'dateLancement',
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
