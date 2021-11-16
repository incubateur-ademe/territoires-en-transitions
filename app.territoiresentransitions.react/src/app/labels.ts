import * as R from 'ramda';
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
  programme: 'Prévue',
  en_cours: 'En cours',
  fait: 'Faite',
  non_renseigne: 'Non renseignée',
};

export const ficheActionAvancementLabels: Record<
  FicheActionAvancement,
  string
> = R.omit(['programme'], avancementLabels);

export const epciCard_AxisShortLabel: Record<string, string> = {
  economie_circulaire__1: 'Stratégie globale',
  economie_circulaire__2:
    'Services de réduction, collecte et valorisation des déchets',
  economie_circulaire__3: "Autres piliers de l'économie circulaire",
  economie_circulaire__4: 'Outils financiers du changement de comportement',
  economie_circulaire__5: 'Coopération et engagement',
};
