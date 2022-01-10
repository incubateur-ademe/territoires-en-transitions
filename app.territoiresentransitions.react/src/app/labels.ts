import type {FicheActionAvancement, ReferentielOfIndicateur} from 'types';
import {Avancement} from 'generated/dataLayer/action_statut_read';

// Define all labels from app
export const referentielToName: Record<ReferentielOfIndicateur, string> = {
  cae: 'Climat Air Énergie',
  eci: 'Économie Circulaire',
  crte: 'Contrat Relance Transition Écologique',
};

type OmitLiteral<
  Literals extends string | number,
  ExcludedLiterals extends Literals
> = keyof Omit<{[Key in Literals]: never}, ExcludedLiterals>;
export type RadioButtonActionAvancement = OmitLiteral<
  Avancement,
  'non_renseigne'
>;

export const avancementLabels: Record<RadioButtonActionAvancement, string> = {
  pas_fait: 'Pas faite',
  programme: 'Programmée',
  fait: 'Faite',
};

export type RadioButtonFicheAvancement = Exclude<
  'non_renseigne',
  FicheActionAvancement
>;

export const ficheActionAvancementLabels: Record<
  RadioButtonFicheAvancement,
  string
> = avancementLabels;

export const epciCard_AxisShortLabel: Record<string, string> = {
  eci_1: 'Stratégie globale',
  eci_2: 'Services de réduction, collecte et valorisation des déchets',
  eci_3: "Autres piliers de l'économie circulaire",
  eci_4: 'Outils financiers du changement de comportement',
  eci_5: 'Coopération et engagement',
};
