import { ColorVariant } from '@tet/design-tokens';
import { Priorite, Statut } from '@tet/domain/plans';
import {
  ActionScoreFinal,
  ReferentielId,
  StatutAvancementIncludingNonConcerne,
  StatutAvancementIncludingNonConcerneDetailleALaTache,
} from '@tet/domain/referentiels';

export type PdfIndicateurDefinition = {
  id: number;
  titre: string;
  unite: string | null;
  participationScore: boolean | null;
  estPerso: boolean;
  hasOpenData: boolean;
};

export type PdfLinkedAction = {
  actionId: string;
  identifiant: string;
  nom: string;
  referentiel: ReferentielId;
  score?: ActionScoreFinal;
};

export const statusToVariant: Record<Statut | 'Sans statut', ColorVariant> = {
  'À venir': 'standard',
  'En cours': 'info',
  Réalisé: 'success',
  'En pause': 'new',
  Abandonné: 'grey',
  'A discuter': 'custom',
  Bloqué: 'warning',
  'En retard': 'error',
  'Sans statut': 'custom',
};

export const prioritesToState: Record<Priorite, ColorVariant> = {
  Bas: 'success',
  Moyen: 'warning',
  Élevé: 'error',
};

type ReferentielLabelKey = ReferentielId | 'crte';
export const referentielToName = {
  cae: 'Climat Air Énergie',
  eci: 'Économie Circulaire',
  crte: 'Contrat Relance Transition Écologique',
  te: 'Transition Écologique',
  'te-test': 'Transition Écologique (test)',
} as const satisfies Record<ReferentielLabelKey, string>;

export const avancementToLabel: Record<
  StatutAvancementIncludingNonConcerneDetailleALaTache,
  string
> = {
  non_renseigne: 'Non renseigné',
  fait: 'Fait',
  pas_fait: 'Pas fait',
  detaille: 'Détaillé au %',
  detaille_a_la_tache: 'Détaillé à la tâche',
  programme: 'Programmé',
  non_concerne: 'Non concerné',
};

export const actionAvancementColors: Record<
  StatutAvancementIncludingNonConcerne,
  string
> = {
  non_concerne: '#929292',
  non_renseigne: '#E5E5E5',
  pas_fait: '#FFCA79',
  programme: '#7AB1E8',
  detaille: '#000091',
  fait: '#34CB6A',
};
