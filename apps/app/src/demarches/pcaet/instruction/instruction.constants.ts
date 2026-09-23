import { appLabels } from '@/app/labels/catalog';
import type { ColorVariant } from '@tet/design-tokens';
import {
  type PcaetDemandeAvisEtat,
  type PcaetStatutInstruction,
} from '@tet/domain/demarches';

/**
 * Au-delà de ce seuil, le tableau de bord n'affiche plus la moyenne exacte mais
 * « 60 jours ou plus » : passé deux mois, le dépassement compte plus que sa
 * valeur.
 *
 * À ne pas confondre avec `DEMARCHE_PCAET_DELAI_AVIS_MOIS` (3 mois), le délai
 * légal au-delà duquel l'instruction se clôt d'elle-même. Ce plafond-ci est un
 * repère d'affichage, plus court, demandé par le métier.
 */
export const DELAI_INSTRUCTION_PLAFOND_JOURS = 60;

const STATUT_INSTRUCTION_LABELS: Record<PcaetStatutInstruction, string> = {
  aucun_depot: appLabels.instructionStatutAucunDepot,
  en_elaboration: appLabels.instructionStatutEnElaboration,
  depot_hors_plateforme: appLabels.instructionStatutDepotHorsPlateforme,
  en_instruction: appLabels.instructionStatutEnInstruction,
  pas_d_avis_depose: appLabels.instructionStatutPasDAvisDepose,
  instruit: appLabels.instructionStatutInstruit,
  adopte: appLabels.instructionStatutAdopte,
  archive: appLabels.instructionStatutArchive,
};

/**
 * Le libellé d'un statut.
 *
 * Le même pour tous les services, à une exception près : un dossier en
 * instruction se dit « À instruire » au service qui rend l'avis, et reste « En
 * instruction » pour celui qui ne fait que le suivre — comme l'état de saisine
 * sur l'écran du dossier.
 */
export const statutInstructionLabel = (
  statut: PcaetStatutInstruction,
  { deposeAvis }: { deposeAvis: boolean }
): string =>
  statut === 'en_instruction' && deposeAvis
    ? appLabels.instructionStatutAInstruire
    : STATUT_INSTRUCTION_LABELS[statut];

/**
 * Les couleurs suivent le sens et non le cycle : ce qui appelle une action est
 * en `warning`, ce qui a manqué en `error`, ce qui est acquis en `success`. Les
 * dépôts encore en chantier sont en `info` — ils informent sans rien réclamer —
 * et les lignes qui ne demandent rien restent grises.
 */
export const STATUT_INSTRUCTION_VARIANTS: Record<
  PcaetStatutInstruction,
  ColorVariant
> = {
  aucun_depot: 'grey',
  en_elaboration: 'info',
  // Vert comme « instruit » : l'avis a été rendu, hors plateforme.
  depot_hors_plateforme: 'success',
  en_instruction: 'warning',
  pas_d_avis_depose: 'error',
  instruit: 'success',
  adopte: 'success',
  archive: 'grey',
};

/**
 * L'état d'une saisine, pour l'écran d'un dossier.
 *
 * Coexiste volontairement avec le statut de la liste, et ne s'y substitue pas :
 * un dossier ouvert a forcément été transmis, si bien que « Aucun dépôt », « En
 * élaboration » et « En révision » n'y veulent rien dire. La liste parle du
 * territoire d'un service, cet écran d'une saisine.
 */
const DEMANDE_AVIS_ETAT_LABELS: Record<PcaetDemandeAvisEtat, string> = {
  a_traiter: appLabels.instructionEtatATraiter,
  brouillon_en_cours: appLabels.instructionEtatBrouillonEnCours,
  avis_rendu: appLabels.instructionEtatAvisRendu,
  delai_ecoule: appLabels.instructionEtatDelaiEcoule,
  clos: appLabels.instructionEtatClos,
};

export const demandeAvisEtatLabel = (
  etat: PcaetDemandeAvisEtat,
  { deposeAvis }: { deposeAvis: boolean }
): string =>
  etat === 'a_traiter' && !deposeAvis
    ? appLabels.instructionEtatInstructionEnCours
    : DEMANDE_AVIS_ETAT_LABELS[etat];

export const DEMANDE_AVIS_ETAT_VARIANTS: Record<
  PcaetDemandeAvisEtat,
  ColorVariant
> = {
  a_traiter: 'warning',
  brouillon_en_cours: 'info',
  avis_rendu: 'success',
  delai_ecoule: 'error',
  clos: 'grey',
};
