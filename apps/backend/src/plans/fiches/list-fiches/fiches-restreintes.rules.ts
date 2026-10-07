import {
  CountByPropertyEnumType,
  FicheWithRelations,
  isListFichesRequestFiltersKeys,
  ListFichesRequestFilters,
  ListFichesRequestFiltersKeys,
} from '@tet/domain/plans';
import { checkCompletion } from './completion';

export type FichesRestreintesAccess = 'readable' | 'masked' | 'excluded';

export type DescriptionSearchScope = 'all' | 'unrestrictedFichesOnly';

export const getDescriptionSearchScope = (
  access: FichesRestreintesAccess
): DescriptionSearchScope =>
  access === 'readable' ? 'all' : 'unrestrictedFichesOnly';

const visibleFilterKeys = new Set<ListFichesRequestFiltersKeys>([
  'noPilote',
  'doesBelongToSeveralPlans',
  'hasDateDeFinPrevisionnelle',
  'ameliorationContinue',
  'restreint',
  'noServicePilote',
  'sharedWithCollectivites',
  'noStatut',
  'statuts',
  'noPriorite',
  'priorites',
  'ficheIds',
  'personnePiloteIds',
  'utilisateurPiloteIds',
  'servicePiloteIds',
  'noPlan',
  'planActionIds',
  'typePeriode',
  'debutPeriode',
  'finPeriode',
  'modifiedSince',
  'texteNomOuDescription',
  'axesId',
  'hasAtLeastBeginningOrEndDate',
  'noTitre',
  'parentsId',
  'onlyChildren',
  'withChildren',
  'withAxesAncestors',
]);

const visibleCountByProperties = new Set<CountByPropertyEnumType>([
  'restreint',
  'ameliorationContinue',
  'statut',
  'priorite',
  'pilotes',
  'services',
  'plans',
  'dateDebut',
  'dateFin',
  'createdAt',
  'modifiedAt',
]);

const isFilterSet = (value: unknown): boolean =>
  value !== undefined && !(Array.isArray(value) && value.length === 0);

const isMaskedFilterSet = ([key, value]: [string, unknown]): boolean =>
  isListFichesRequestFiltersKeys(key) &&
  !visibleFilterKeys.has(key) &&
  isFilterSet(value);

export const hasFilterOnMaskedField = (
  filters: ListFichesRequestFilters
): boolean => Object.entries(filters).some(isMaskedFilterSet);

export const isCountByPropertyMasked = (
  countByProperty: CountByPropertyEnumType
): boolean => !visibleCountByProperties.has(countByProperty);

export const getFichesRestreintesAccess = ({
  canReadFichesRestreintes,
  filters,
  readsMaskedFields,
}: {
  canReadFichesRestreintes: boolean;
  filters: ListFichesRequestFilters;
  readsMaskedFields: boolean;
}): FichesRestreintesAccess => {
  if (canReadFichesRestreintes) {
    return 'readable';
  }
  const isReadingMaskedField =
    readsMaskedFields || hasFilterOnMaskedField(filters);
  if (isReadingMaskedField) {
    return 'excluded';
  }
  return 'masked';
};

const toMaskedFicheRestreinte = (
  fiche: FicheWithRelations
): Omit<FicheWithRelations, 'completion'> => ({
  id: fiche.id,
  collectiviteId: fiche.collectiviteId,
  collectiviteNom: fiche.collectiviteNom,
  parentId: fiche.parentId,
  titre: fiche.titre,
  statut: fiche.statut,
  priorite: fiche.priorite,
  dateDebut: fiche.dateDebut,
  dateFin: fiche.dateFin,
  ameliorationContinue: fiche.ameliorationContinue,
  createdAt: fiche.createdAt,
  modifiedAt: fiche.modifiedAt,
  restreint: fiche.restreint,
  pilotes: fiche.pilotes,
  services: fiche.services,
  plans: fiche.plans,
  axes: fiche.axes,
  sharedWithCollectivites: fiche.sharedWithCollectivites,
  actionImpactId: fiche.actionImpactId,
  description: null,
  piliersEci: null,
  objectifs: null,
  cibles: null,
  ressources: null,
  financements: null,
  budgetPrevisionnel: null,
  participationCitoyenne: null,
  participationCitoyenneType: null,
  tempsDeMiseEnOeuvre: null,
  majTermine: null,
  createdBy: null,
  modifiedBy: null,
  partenaires: null,
  referents: null,
  libreTags: null,
  instanceGouvernance: null,
  financeurs: null,
  sousThematiques: null,
  thematiques: null,
  structures: null,
  indicateurs: null,
  effetsAttendus: null,
  etapes: null,
  notes: null,
  mesures: null,
  fichesLiees: null,
  docs: null,
  budgets: null,
});

export const maskFicheRestreinte = (
  fiche: FicheWithRelations
): FicheWithRelations => {
  const maskedFiche = toMaskedFicheRestreinte(fiche);
  const [completion] = checkCompletion([maskedFiche]);
  return { ...maskedFiche, completion };
};

export const maskFichesRestreintes = (
  fiches: FicheWithRelations[]
): FicheWithRelations[] =>
  fiches.map((fiche) => (fiche.restreint ? maskFicheRestreinte(fiche) : fiche));

export const toFichesWithReadableBudget = <
  Fiche extends Pick<FicheWithRelations, 'restreint'>
>({
  fiches,
  canReadFichesRestreintes,
}: {
  fiches: Fiche[];
  canReadFichesRestreintes: boolean;
}): Fiche[] =>
  canReadFichesRestreintes
    ? fiches
    : fiches.filter((fiche) => !fiche.restreint);
