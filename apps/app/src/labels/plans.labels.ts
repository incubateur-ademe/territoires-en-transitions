import { plural } from '@tet/ui/labels/plural';

export const plansLabels = {
  /** Plan */
  nomPlan: 'Nom du plan',
  nomPlanRequis: 'Le nom du plan est requis',
  nomPlanTropLong: 'Le nom du plan ne doit pas dépasser 300 caractères',
  axe: plural({ one: 'axe', other: 'axes' }),
  sousAxe: plural({ one: 'sous-axe', other: 'sous-axes' }),

  /** Action */
  ficheStatut: 'Statut',
  niveauPriorite: 'Niveau de priorité',
  ficheObjectif: plural({ one: 'objectif', other: 'objectifs' }),
  actionSansPlan: 'Action sans emplacement',
  ficheEffetsAttendus: plural({
    one: 'Effet attendu',
    other: 'Effets attendus',
  }),
  ficheLibreTag: plural({
    one: 'Tag personnalisé',
    other: 'Tags personnalisés',
  }),
  ficheStructurePilote: plural({
    one: 'Structure pilote',
    other: 'Structures pilotes',
  }),
  fichePartenaire: plural({
    one: 'Partenaire',
    other: 'Partenaires',
  }),
  ficheCible: plural({
    one: 'Cible',
    other: 'Cibles',
  }),
  ficheInstanceGouvernance: plural({
    one: 'Instance de gouvernance',
    other: 'Instances de gouvernance',
  }),
  ficheParticipationCitoyenne: plural({
    one: 'Participation citoyenne',
    other: 'Participation citoyenne',
  }),
  ficheParticipationSans: 'Sans participation citoyenne',

  /** Filtres */
  filtreNoObjectif: 'Sans objectif',
  filtreNoReferent: 'Sans référent',
  filtreNoStatut: 'Sans statut',
  filtreNoPriorite: 'Sans niveau de priorité',
  filtreTypePeriode: 'Période appliquée à la date',
  filtreDebutPeriode: 'Du',
  filtreFinPeriode: 'Au',
  filtreRestreint: 'Action en mode privé',
  filtreHasIndicateurLies: 'Indicateur(s) associé(s)',
  filtreHasMesuresLiees: 'Actions avec mesure(s) des référentiels liée(s)',
  filtreHasBudget: 'Budget(s) renseigné(s)',
  actionRepeteTousLesAns: "L'action se répète tous les ans",
  filtreFinanceurIds: 'Financeur',
  filtrePartenaireIds: 'Partenaire',
  filtreCibles: 'Cible',
  filtreLibreTagsIds: 'Tags personnalisés',
  filtreInstanceGouvernanceIds: 'Instance de gouvernance',
  filtreStructurePiloteIds: 'Structure pilote',
  filtreFicheIds: 'Action',
  filtreLinkedFicheIds: 'Action liée',
  filtreSharedWithCollectivites:
    "Action mutualisée avec d'autres collectivités",
  filtreActionsMutualiseesPlusieursPlans:
    'Actions mutualisées dans plusieurs plans',
  filtreHasAtLeastBeginningOrEndDate: 'Date de début ou de fin renseignée',
  filtreHasDateDeFinPrevisionnelle: 'Date de fin prévisionnelle renseignée',
  filtreNoTag: 'Sans tags personnalisés',
  filtreNotes: 'Notes',
  filtreAnneesNotes: 'Année(s) de notes',
  filtreIndicateurIds: 'Indicateur(s)',
  filtreNoDescription: 'Sans description',

  typePeriodeCreation: 'de création',
  typePeriodeModification: 'de modification',
  typePeriodeDebut: 'de début',
  typePeriodeFin: 'de fin prévisionnelle',
};
