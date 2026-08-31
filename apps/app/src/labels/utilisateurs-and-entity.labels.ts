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
  membreTeteFonctionConseiller: 'Conseiller ou conseillère',
  membreTeteFonctionPartenaire: 'Partenaire',

  /** Entités */
  pilote: plural({ one: 'Pilote', other: 'Pilotes' }),

  personnePilote: plural({
    one: 'Personne pilote',
    other: 'Personnes pilotes',
  }),
  personnePiloteSans: 'Sans personne pilote',
  personnePiloteSelectOrCreatePlaceholder: (isEditionAllowed: boolean) =>
    `Sélectionner ${isEditionAllowed ? 'ou créer ' : ''}une personne pilote`,
  personnePiloteAjouter: 'Ajouter une personne pilote',
  personnePiloteEditer: 'Éditer la personne pilote',
  personnePiloteDissocier: 'Dissocier une personne pilote',

  referentTechnique: plural({
    one: 'Référent·e technique',
    other: 'Référent·es techniques',
  }),

  personneElue: plural({
    one: 'Personne élue',
    other: 'Personnes élues',
  }),
  personneElueSelectOrCreatePlaceholder:
    'Sélectionner ou créer une personne élue',
  personneElueSelectPlaceholder: 'Sélectionner une personne élue',
  personneElueEditer: 'Éditer la personne élue',
  personneElueAjouter: 'Ajouter une personne élue',
  personneElueDissocier: 'Dissocier une personne élue',

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

  cibleGrandPublic: 'Grand public',
  cibleAssociations: 'Associations',
  ciblePublicScolaire: 'Public scolaire',
  cibleActeursEconomiques: 'Acteurs économiques',
  cibleActeursEconomiquesPrimaire: 'Acteurs économiques du secteur primaire',
  cibleActeursEconomiquesSecondaire:
    'Acteurs économiques du secteur secondaire',
  cibleActeursEconomiquesTertiaire: 'Acteurs économiques du secteur tertiaire',
  ciblePartenaires: 'Partenaires',
  cibleAutresCollectivites: 'Autres collectivités du territoire',
  cibleCollectiviteElleMeme: 'Collectivité elle-même',
  cibleElusLocaux: 'Élus locaux',
  cibleAgents: 'Agents',
  ciblePlaceholderSelectionner: 'Sélectionner une ou plusieurs cibles',

  acteur: plural({ one: 'Acteur', other: 'Acteurs' }),
};
