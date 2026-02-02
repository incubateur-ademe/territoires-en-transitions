import { FilterKeys, Filters } from './types';

export const filterLabels: Record<FilterKeys, string> = {
  axesId: 'Axes',
  sort: 'Tri',
  planActionIds: 'Plans',
  utilisateurPiloteIds: 'Personne pilote',
  utilisateurReferentIds: 'Élu·e référent·e',
  statuts: 'Statut',
  priorites: 'Niveau de priorité',
  noPilote: 'Sans pilote',
  noReferent: 'Sans référent',
  noStatut: 'Sans statut',
  noPlan: 'Sans plan',
  noPriorite: 'Sans niveau de priorité',
  typePeriode: 'Période appliquée à la date',
  debutPeriode: 'Du',
  finPeriode: 'Au',
  restreint: 'Action en mode privé',
  hasIndicateurLies: 'Indicateur(s) associé(s)',
  hasMesuresLiees: 'Actions avec mesure(s) des référentiels liée(s)',
  hasBudget: 'Budget(s) renseigné(s)',
  ameliorationContinue: "L'action se répète tous les ans",
  sousThematiqueIds: 'Thématique',
  financeurIds: 'Financeur',
  partenaireIds: 'Partenaire',
  cibles: 'Cible',
  libreTagsIds: 'Tags personnalisés',
  instanceGouvernanceIds: 'Instance de gouvernance',
  thematiqueIds: 'Thématique',
  structurePiloteIds: 'Structure pilote',
  servicePiloteIds: 'Direction ou service pilote',
  ficheIds: 'Action',
  linkedFicheIds: 'Action liée',
  noServicePilote: 'Sans direction ou service pilote',
  personnePiloteIds: 'Personne pilote',
  personneReferenteIds: 'Élu·e référent·e',
  sharedWithCollectivites: "Action mutualisée avec d'autres collectivités",
  doesBelongToSeveralPlans: 'Actions mutualisées dans plusieurs plans',
  hasAtLeastBeginningOrEndDate: 'Date de début ou de fin renseignée',
  hasDateDeFinPrevisionnelle: 'Date de fin prévisionnelle renseignée',
  noTag: 'Sans tags personnalisés',
  notes: 'Notes',
  anneesNotes: 'Année(s) de notes',
  indicateurIds: 'Indicateur(s)',
  noTitre: 'Sans titre',
  noDescription: 'Sans description',
  noObjectif: 'Sans objectif',
};

export const typePeriodLabels: Record<
  NonNullable<Filters['typePeriode']>,
  string
> = {
  creation: 'de création',
  modification: 'de modification',
  debut: 'de début',
  fin: 'de fin prévisionnelle',
};

export const getFilterLabel = (key: FilterKeys) => {
  return filterLabels[key];
};
