import {TActionAvancementExt} from 'types/alias';
import type {ReferentielOfIndicateur} from 'types/litterals';

// Define all labels from app
export const referentielToName: Record<ReferentielOfIndicateur, string> = {
  cae: 'Climat Air Énergie',
  eci: 'Économie Circulaire',
  crte: 'Contrat Relance Transition Écologique',
};

export const avancementToLabel: Record<TActionAvancementExt, string> = {
  non_renseigne: 'Non renseigné',
  fait: 'Fait',
  pas_fait: 'Pas fait',
  detaille: 'Détaillé',
  programme: 'Programmé',
  non_concerne: 'Non concerné',
};

export const actionIdToLabel: Record<string, string> = {
  cae_3: 'Énergie, eau, assainissement',
  eci_1: 'Stratégie globale',
  eci_2: 'Réduction, collecte et valorisation des déchets',
  eci_3: "Autres piliers de l'ECI",
  eci_4: 'Outils financiers',
};
