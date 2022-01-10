import {FicheActionAvancement} from 'generated/dataLayer/fiche_action_write';
import type {ReferentielOfIndicateur} from 'types';

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

export type FicheActionAvancementRenseigne = OmitLiteral<
  FicheActionAvancement,
  'non_renseigne'
>;

export const ficheActionAvancementLabels: Record<
  FicheActionAvancementRenseigne,
  string
> = {
  pas_fait: 'Pas faite',
  en_cours: 'En cours',
  fait: 'Faite',
};

export const epciCard_AxisShortLabel: Record<string, string> = {
  eci_1: 'Stratégie globale',
  eci_2: 'Services de réduction, collecte et valorisation des déchets',
  eci_3: "Autres piliers de l'économie circulaire",
  eci_4: 'Outils financiers du changement de comportement',
  eci_5: 'Coopération et engagement',
};
