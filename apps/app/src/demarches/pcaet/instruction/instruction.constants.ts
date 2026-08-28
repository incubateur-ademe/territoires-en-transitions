import { appLabels } from '@/app/labels/catalog';
import type { ColorVariant } from '@tet/design-tokens';
import type { PcaetDemandeAvisEtat } from '@tet/domain/demarches';

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

export const DEMANDE_AVIS_ETAT_LABELS: Record<PcaetDemandeAvisEtat, string> = {
  a_traiter: appLabels.instructionEtatATraiter,
  brouillon_en_cours: appLabels.instructionEtatBrouillonEnCours,
  avis_rendu: appLabels.instructionEtatAvisRendu,
  delai_ecoule: appLabels.instructionEtatDelaiEcoule,
  clos: appLabels.instructionEtatClos,
};

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
