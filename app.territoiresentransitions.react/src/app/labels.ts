import * as R from 'ramda';
import type {
  Avancement,
  FicheActionAvancement,
  ReferentielOfIndicateur,
} from 'types';

// Define all labels from app
export const referentielToName: Record<ReferentielOfIndicateur, string> = {
  cae: 'Climat Air Énergie',
  eci: 'Économie Circulaire',
  crte: 'Contrat Relance Transition Écologique',
};

export const avancementLabels: Omit<Record<Avancement, string>, ''> = {
  non_concernee: 'Non concernée',
  pas_faite: 'Pas faite',
  programmee: 'Prévue',
  en_cours: 'En cours',
  faite: 'Faite',
};

export const ficheActionAvancementLabels: Record<
  FicheActionAvancement,
  string
> = R.omit(['non_concernee', 'programmee'], avancementLabels);

export const epciCard_AxisShortLabel: Record<string, string> = {
  economie_circulaire__1: 'Stratégie globale',
  economie_circulaire__2:
    'Services de réduction, collecte et valorisation des déchets',
  economie_circulaire__3: "Autres piliers de l'économie circulaire",
  economie_circulaire__4: 'Outils financiers du changement de comportement',
  economie_circulaire__5: 'Coopération et engagement',
};
