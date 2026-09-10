import {
  demarchePcaetObligationSchema,
  pcaetStatutInstructionSchema,
  STATUTS_INSTRUCTION_PAR_DEFAUT,
} from '@tet/domain/demarches';
import { z } from 'zod';

export const listDossiersInstructionSortValues = [
  'echeance',
  'dateDebut',
  'collectivite',
  'contact',
  'statut',
] as const;

export type ListDossiersInstructionSort =
  (typeof listDossiersInstructionSortValues)[number];

export const listDossiersInstructionInputSchema = z.object({
  /** Le service instructeur dont on liste le territoire. */
  collectiviteId: z.number().int().positive(),
  /**
   * Les statuts retenus. Trois cas, et il faut les trois :
   *
   * - champ absent : le défaut, qui reproduit ce que l'écran montrait avant
   *   les filtres — sans les dépôts en chantier, les cycles clos ni les
   *   collectivités qui n'ont rien déposé, un millier de lignes pour la DGEC ;
   * - liste vide : aucun filtre, tous les statuts. C'est ce que dit
   *   « Désélectionner les options » ;
   * - liste garnie : ces statuts-là.
   */
  statuts: z
    .array(pcaetStatutInstructionSchema)
    .prefault([...STATUTS_INSTRUCTION_PAR_DEFAUT]),
  obligations: z.array(demarchePcaetObligationSchema).optional(),
  /**
   * Filtre par région de la collectivité déposante. N'a de sens que pour un
   * service qui en couvre plusieurs : un national, ou la DR ADEME Océan Indien
   * et son périmètre secondaire.
   */
  regionCodes: z.string().array().optional(),
  recherche: z.string().trim().min(1).optional(),
  sort: z.enum(listDossiersInstructionSortValues).prefault('echeance'),
  /**
   * Échéance décroissante par défaut : l'échéance étant la transmission plus le
   * délai légal, les dossiers arrivés le plus récemment remontent en tête.
   */
  direction: z.enum(['asc', 'desc']).prefault('desc'),
  page: z.coerce.number().int().min(1).prefault(1),
  limit: z.coerce.number().int().min(1).max(200).prefault(25),
});

export type ListDossiersInstructionInput = z.infer<
  typeof listDossiersInstructionInputSchema
>;
