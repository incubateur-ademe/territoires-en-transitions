import { appLabels } from '@/app/labels/catalog';
import { FilterKeys, Filters } from './types';

export const filterLabels: Record<FilterKeys, string> = {
  axesId: appLabels.filtreAxesId,
  sort: appLabels.filtreSort,
  planActionIds: appLabels.plans,
  utilisateurPiloteIds: appLabels.personnePilote,
  utilisateurReferentIds: appLabels.eluReferent,
  statuts: appLabels.statut,
  priorites: appLabels.niveauPriorite,
  noPilote: appLabels.filtreNoPilote,
  noReferent: appLabels.filtreNoReferent,
  noStatut: appLabels.filtreNoStatut,
  noPlan: appLabels.filtreNoPlan,
  noPriorite: appLabels.filtreNoPriorite,
  typePeriode: appLabels.filtreTypePeriode,
  debutPeriode: appLabels.filtreDebutPeriode,
  finPeriode: appLabels.filtreFinPeriode,
  restreint: appLabels.filtreRestreint,
  hasIndicateurLies: appLabels.filtreHasIndicateurLies,
  hasMesuresLiees: appLabels.filtreHasMesuresLiees,
  hasBudget: appLabels.filtreHasBudget,
  ameliorationContinue: appLabels.actionRepeteTousLesAns,
  sousThematiqueIds: appLabels.thematique,
  financeurIds: appLabels.filtreFinanceurIds,
  partenaireIds: appLabels.filtrePartenaireIds,
  cibles: appLabels.filtreCibles,
  libreTagsIds: appLabels.filtreLibreTagsIds,
  instanceGouvernanceIds: appLabels.filtreInstanceGouvernanceIds,
  thematiqueIds: appLabels.thematique,
  structurePiloteIds: appLabels.filtreStructurePiloteIds,
  servicePiloteIds: appLabels.directionOuServicePilote,
  ficheIds: appLabels.filtreFicheIds,
  linkedFicheIds: appLabels.filtreLinkedFicheIds,
  noServicePilote: appLabels.filtreNoServicePilote,
  personnePiloteIds: appLabels.personnePilote,
  personneReferenteIds: appLabels.eluReferent,
  sharedWithCollectivites: appLabels.filtreSharedWithCollectivites,
  doesBelongToSeveralPlans: appLabels.filtreActionsMutualiseesPlusieursPlans,
  hasAtLeastBeginningOrEndDate: appLabels.filtreHasAtLeastBeginningOrEndDate,
  hasDateDeFinPrevisionnelle: appLabels.filtreHasDateDeFinPrevisionnelle,
  noTag: appLabels.filtreNoTag,
  notes: appLabels.filtreNotes,
  anneesNotes: appLabels.filtreAnneesNotes,
  indicateurIds: appLabels.filtreIndicateurIds,
  noTitre: appLabels.sansTitre,
  noDescription: appLabels.filtreNoDescription,
  noObjectif: appLabels.filtreNoObjectif,
};

export const typePeriodLabels: Record<
  NonNullable<Filters['typePeriode']>,
  string
> = {
  creation: appLabels.typePeriodeCreation,
  modification: appLabels.typePeriodeModification,
  debut: appLabels.typePeriodeDebut,
  fin: appLabels.typePeriodeFin,
};

export const getFilterLabel = (key: FilterKeys) => {
  return filterLabels[key];
};
