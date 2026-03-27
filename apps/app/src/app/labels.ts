import { MembreFonction } from '@tet/domain/collectivites';
import {
  ReferentielId,
  StatutAvancementCreate,
} from '@tet/domain/referentiels';

// Define all labels from app
type ReferentielLabelKey = ReferentielId | 'crte';
export const referentielToName = {
  cae: 'Climat Air Énergie',
  eci: 'Économie Circulaire',
  crte: 'Contrat Relance Transition Écologique', // TODO: Legacy, voir si crte est toujours utilisé
  te: 'Transition Écologique',
  'te-test': 'Transition Écologique (test)',
} as const satisfies Record<ReferentielLabelKey, string>;

export const avancementToLabel: Record<StatutAvancementCreate, string> = {
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

export const membreFonctions: { value: MembreFonction; label: string }[] = [
  { value: 'technique', label: 'Directions et services techniques' },
  { value: 'politique', label: 'Équipe politique' },
  { value: 'conseiller', label: "Bureau d'études" },
  { value: 'partenaire', label: 'Partenaire' },
];

export const membreFonctionToLabel = membreFonctions.reduce(
  (acc, { value, label }) => ({ ...acc, [value]: label }),
  {} as Record<MembreFonction, string>
);

export const membreFonctionToTeteFonction: Record<string, string> = {
  technique: 'Chef·fe de projet',
  politique: 'Élu·e',
  conseiller: 'Conseiller·ère',
  partenaire: 'Partenaire',
};
