import type { ReferentielOfIndicateur } from '@/app/referentiels/litterals';
import { TMembreFonction } from '@/app/types/alias';
import { StatutAvancementIncludingNonConcerne } from '@/domain/referentiels';

// Define all labels from app
export const referentielToName: Record<
  ReferentielOfIndicateur | string,
  string
> = {
  cae: 'Climat Air Énergie',
  eci: 'Économie Circulaire',
  crte: 'Contrat Relance Transition Écologique',
};

export const avancementToLabel: Record<
  StatutAvancementIncludingNonConcerne,
  string
> = {
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

export const membreFonctions: { value: TMembreFonction; label: string }[] = [
  { value: 'technique', label: 'Directions et services techniques' },
  { value: 'politique', label: 'Équipe politique' },
  { value: 'conseiller', label: "Bureau d'études" },
  { value: 'partenaire', label: 'Partenaire' },
];

export const membreFonctionToLabel: Record<TMembreFonction, string> = {
  technique: 'Directions et services techniques',
  politique: 'Équipe politique',
  conseiller: "Bureau d'études",
  partenaire: 'Partenaire',
};

export const membreFonctionToTeteFonction: Record<string, string> = {
  technique: 'Chef·fe de projet',
  politique: 'Élu·e',
  conseiller: 'Conseiller·ère',
  partenaire: 'Partenaire',
};
