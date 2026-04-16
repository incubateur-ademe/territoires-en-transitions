import { appLabels } from '@/app/labels/catalog';
import { MembreFonction } from '@tet/domain/collectivites';
import {
  ReferentielId,
  StatutAvancementIncludingNonConcerne,
  StatutAvancementIncludingNonConcerneDetailleALaTache,
} from '@tet/domain/referentiels';

// Define all labels from app
type ReferentielLabelKey = ReferentielId | 'crte';
export const referentielToName: Record<ReferentielLabelKey, string> = {
  cae: appLabels.referentielCae,
  eci: appLabels.referentielEci,
  crte: appLabels.referentielCrte,
  te: appLabels.referentielTe,
  'te-test': appLabels.referentielTeTest,
};

export const avancementToLabel: Record<
  StatutAvancementIncludingNonConcerneDetailleALaTache,
  string
> = {
  non_renseigne: appLabels.nonRenseigne,
  fait: appLabels.avancementFait,
  pas_fait: appLabels.avancementPasFait,
  detaille: appLabels.avancementDetaille,
  detaille_a_la_tache: appLabels.avancementDetailleALaTache,
  programme: appLabels.avancementProgramme,
  non_concerne: appLabels.avancementNonConcerne,
};

/** Labels for statut options including display-only "Détaillé à la tâche" (subaction with tasks) */
export const avancementDisplayToLabel: Record<
  StatutAvancementIncludingNonConcerne | 'detaille_a_la_tache',
  string
> = {
  ...avancementToLabel,
  detaille_a_la_tache: appLabels.avancementDetailleALaTache,
};

export const actionIdToLabel: Record<string, string> = {
  cae_3: appLabels.actionCae3,
  eci_1: appLabels.actionEci1,
  eci_2: appLabels.actionEci2,
  eci_3: appLabels.actionEci3,
  eci_4: appLabels.actionEci4,
};

export const membreFonctions: { value: MembreFonction; label: string }[] = [
  { value: 'technique', label: appLabels.membreFonctionTechnique },
  { value: 'politique', label: appLabels.membreFonctionPolitique },
  { value: 'conseiller', label: appLabels.membreFonctionConseiller },
  { value: 'partenaire', label: appLabels.membreFonctionPartenaire },
];

export const membreFonctionToLabel = membreFonctions.reduce(
  (acc, { value, label }) => ({ ...acc, [value]: label }),
  {} as Record<MembreFonction, string>
);

export const membreFonctionToTeteFonction: Record<string, string> = {
  technique: appLabels.membreTeteFonctionTechnique,
  politique: appLabels.membreTeteFonctionPolitique,
  conseiller: appLabels.membreTeteFonctionConseiller,
  partenaire: appLabels.membreTeteFonctionPartenaire,
};
