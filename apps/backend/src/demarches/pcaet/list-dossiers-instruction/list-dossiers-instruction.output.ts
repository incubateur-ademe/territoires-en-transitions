import {
  demarchePcaetObligationValues,
  demarchePcaetStatusValues,
  pcaetStatutInstructionSchema,
  pcaetStatutInstructionValues,
  type PcaetStatutInstruction,
} from '@tet/domain/demarches';
import { z } from 'zod';

export const dossierInstructionContactSchema = z.object({
  prenom: z.string(),
  nom: z.string(),
  email: z.string(),
});

export type DossierInstructionContact = z.infer<
  typeof dossierInstructionContactSchema
>;

/**
 * D'où vient l'obligation affichée.
 *
 * `demarche` : la collectivité déposante l'a déclarée sur son dépôt.
 * `assujettissement` : aucun dépôt ne la porte, elle est déduite de la
 * collectivité — sa famille juridique et sa population.
 *
 * Les deux peuvent se contredire d'une ligne à l'autre : un EPCI assujetti a
 * pu se déclarer volontaire. L'écran doit pouvoir le dire plutôt que de
 * présenter les deux comme un même fait.
 */
export const obligationSourceSchema = z.enum(['demarche', 'assujettissement']);

export type ObligationSource = z.infer<typeof obligationSourceSchema>;

export const dossierInstructionLigneSchema = z.object({
  /** `null` quand la collectivité n'a aucune démarche PCAET. */
  demarcheId: z.number().int().nullable(),
  /**
   * La saisine de ce service sur ce dossier, `null` tant que la démarche n'a
   * pas été transmise. C'est elle qui ouvre le dossier : sans elle, la ligne
   * informe mais ne se consulte pas.
   */
  demandeAvisId: z.number().int().nullable(),
  demarcheTitre: z.string().nullable(),
  demarcheStatus: z.enum(demarchePcaetStatusValues).nullable(),
  /** Date de début de l'élaboration, ce qui dit depuis quand un dépôt traîne. */
  launchedAt: z.string().nullable(),
  avisDeadlineAt: z.string().nullable(),
  transmittedAt: z.string().nullable(),
  collectivite: z.object({
    id: z.number().int(),
    nom: z.string(),
    departementCode: z.string().nullable(),
    regionCode: z.string().nullable(),
    regionLibelle: z.string().nullable(),
  }),
  contacts: dossierInstructionContactSchema.array(),
  /**
   * Ce dossier attend-il un avis de ce service, ou se contente-t-il de le lui
   * donner à lire ?
   *
   * Par ligne, et non par service : une DREAL dépose sur le dossier de sa
   * région et lit celui de l'EPCI voisin qui déborde chez elle. L'écran lit ce
   * drapeau plutôt que de déduire un droit du type de la collectivité.
   */
  deposeAvis: z.boolean(),
  statut: pcaetStatutInstructionSchema,
  obligation: z.enum(demarchePcaetObligationValues).nullable(),
  obligationSource: obligationSourceSchema.nullable(),
  nbAvisValides: z.number().int(),
  nbAvisBrouillons: z.number().int(),
});

export type DossierInstructionLigne = z.infer<
  typeof dossierInstructionLigneSchema
>;

export const dossiersInstructionStatsSchema = z.object({
  delaiMoyenJours: z.number().int().nullable(),
});

export type DossiersInstructionStats = z.infer<
  typeof dossiersInstructionStatsSchema
>;

export const perimetreRegionSchema = z.object({
  code: z.string(),
  libelle: z.string(),
});

export type PerimetreRegion = z.infer<typeof perimetreRegionSchema>;

export const listDossiersInstructionOutputSchema = z.object({
  items: dossierInstructionLigneSchema.array(),
  /** Nombre de lignes après filtrage, ce que pagine l'écran. */
  total: z.number().int(),
  /**
   * Nombre de lignes du périmètre, filtres ignorés.
   *
   * Ce qui distingue « ce service n'a rien à instruire » de « ces filtres-ci ne
   * rendent rien » — le filtre par défaut masquant à lui seul les dépôts en
   * chantier et les collectivités sans dossier, `total` à zéro ne dit pas que
   * le territoire est vide. Ne se déduit pas de `countByStatut`, qui ne compte
   * que la charge du service et laisse de côté ce qu'il reçoit en lecture.
   */
  totalPerimetre: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  /**
   * Décompte par statut sur **tout** le périmètre, filtres ignorés : les
   * compteurs disent la charge du service, la liste dit ce qu'il regarde.
   */
  countByStatut: z.record(pcaetStatutInstructionSchema, z.number().int()),
  /**
   * Les régions que ce service couvre. Un seul élément pour une DREAL, deux
   * pour la DR ADEME Océan Indien, toutes pour un service national — c'est ce
   * qui décide si la colonne « Région » a lieu d'être, et ce qui alimente son
   * filtre.
   */
  perimetreRegions: perimetreRegionSchema.array(),
  stats: dossiersInstructionStatsSchema,
});

export type ListDossiersInstructionOutput = z.infer<
  typeof listDossiersInstructionOutputSchema
>;

export const emptyCountByStatut = (): Record<PcaetStatutInstruction, number> =>
  Object.fromEntries(
    pcaetStatutInstructionValues.map((statut) => [statut, 0])
  ) as Record<PcaetStatutInstruction, number>;
