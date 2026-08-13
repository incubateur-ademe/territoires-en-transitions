import { appLabels } from '@/app/labels/catalog';
import type { ColorVariant } from '@tet/design-tokens';
import type { PcaetDemandeAvisEtat } from '@tet/domain/demarches';

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
