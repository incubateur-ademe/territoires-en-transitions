import type {FicheActionAvancement, ReferentielOfIndicateur} from 'types';
import {Avancement} from 'generated/dataLayer/action_statut_read';

// Define all labels from app
export const referentielToName: Record<ReferentielOfIndicateur, string> = {
  cae: 'Climat Air Énergie',
  eci: 'Économie Circulaire',
  crte: 'Contrat Relance Transition Écologique',
};

export const avancementLabels: Record<Avancement, string> = {
  //non_concerne: 'Non concernée',
  pas_fait: 'Pas faite',
  programme: 'Programmée',
  fait: 'Faite',
  non_renseigne: 'Non renseignée',
};

export const ficheActionAvancementLabels: Record<
  FicheActionAvancement,
  string
> = avancementLabels;

export const epciCard_AxisShortLabel: Record<string, string> = {
  eci_1: 'Stratégie globale',
  eci_2: 'Services de réduction, collecte et valorisation des déchets',
  eci_3: "Autres piliers de l'économie circulaire",
  eci_4: 'Outils financiers du changement de comportement',
  eci_5: 'Coopération et engagement',
};
