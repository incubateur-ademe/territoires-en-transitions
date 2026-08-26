import { plural } from '@tet/ui/labels/plural';

export const utilisateursAndEntityLabels = {
  /** Rôles et permissions */
  roleSuperAdmin: 'Super Admin',
  roleAdmin: 'Admin',
  roleEdition: 'Éditeur',
  roleContributeur: 'Contributeur',
  roleLecteur: 'Lecteur',
  roleAdminDescription:
    'Peut entièrement configurer, éditer, et inviter de nouveaux membres',
  roleEditionDescription: 'Peut éditer',
  roleContributeurDescription:
    'Peut éditer uniquement les actions & indicateurs dont il est le pilote',
  roleLecteurDescription: 'Peut uniquement consulter',

  /** Fonctions */
  membreFonctionTechnique: 'Directions et services techniques',
  membreFonctionPolitique: 'Équipe politique',
  membreFonctionConseiller: "Bureau d'études",
  membreFonctionPartenaire: 'Partenaire',

  membreTeteFonctionTechnique: 'Chef·fe de projet',
  membreTeteFonctionPolitique: 'Élu·e',
  membreTeteFonctionConseiller: 'Conseiller·ère',
  membreTeteFonctionPartenaire: 'Partenaire',

  pilote: plural({ one: 'Pilote', other: 'Pilotes' }),

  personnePilote: plural({
    one: 'Personne pilote',
    other: 'Personnes pilotes',
  }),
  personnePiloteAjouter: 'Ajouter une personne pilote',
  personnePiloteEditer: 'Éditer la personne pilote',
  personnePiloteDissocier: 'Dissocier une personne pilote',

  referentTechnique: plural({
    one: 'Référent·e technique',
    other: 'Référent·es techniques',
  }),

  eluReferent: plural({ one: 'Élu·e référent·e', other: 'Élu·es référent·es' }),
  eluReferentPlaceholderSelectionner:
    'Sélectionner ou créer un·e élu·e référent·e',
  eluReferentEditer: "Éditer l'élu·e référent·e",
  eluReferentAjouter: 'Ajouter un·e élu·e référent·e',
  eluReferentDissocier: 'Dissocier un·e élu·e référent·e',

  directionOuServicePilote: plural({
    one: 'Direction ou service pilote',
    other: 'Directions ou services pilotes',
  }),
  directionOuServicePiloteSans: 'Sans direction ou service pilote',
  directionOuServicePilotePlaceholderSelectionner: (
    isEditionAllowed: boolean
  ) =>
    `Sélectionner ${
      isEditionAllowed ? 'ou créer ' : ''
    }une direction ou service pilote`,
  directionOuServicePiloteEditer: 'Éditer la direction ou service pilote',
  directionOuServicePiloteAjouter: 'Ajouter une direction ou service pilote',
  directionOuServicePiloteDissocier:
    'Dissocier une direction ou service pilote',
};
