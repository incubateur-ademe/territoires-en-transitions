import { Filters } from './types';

/** Paramètres d'URL possibles pour les filtres de fiches action */
export type FicheSearchParameters =
  | 's'
  | 'prio'
  | 'ms'
  | 'text'
  | 'bp'
  | 'dfp'
  | 'r'
  | 'i'
  | 'il'
  | 'ml'
  | 'iitop'
  | 'fa'
  | 'pa'
  | 'ra'
  | 'up'
  | 'pp'
  | 'ur'
  | 'pt'
  | 'pr'
  | 'sp'
  | 'sv'
  | 'lt'
  | 't'
  | 'f'
  | 'c'
  | 'dd'
  | 'df'
  | 'ac'
  | 'p'
  | 'lf'
  | 'sort'
  | 'ssp'
  | 'sssp'
  | 'sss'
  | 'tp'
  | 'dp'
  | 'fp'
  | 'pe'
  | 'st'
  | 'ea'
  | 'pc'
  | 'ax'
  | 'np'
  | 'npr'
  | 'ma'
  | 'nt'
  | 'nds'
  | 'ands'
  | 'nr'
  | 'swc';

export const nameToparams: Record<
  keyof Filters | 'sort' | 'page',
  FicheSearchParameters
> = {
  statuts: 's',
  priorites: 'prio',
  modifiedSince: 'ms',
  texteNomOuDescription: 'text',
  hasBudgetPrevisionnel: 'bp',
  hasDateDeFinPrevisionnelle: 'dfp',
  restreint: 'r',
  hasIndicateurLies: 'il',
  hasMesuresLiees: 'ml',
  doesBelongToSeveralPlans: 'iitop',
  planActionIds: 'pa',
  ficheIds: 'fa',
  mesureIds: 'ra',
  linkedFicheIds: 'lf',
  utilisateurPiloteIds: 'up',
  personnePiloteIds: 'pp',
  utilisateurReferentIds: 'ur',
  partenaireIds: 'pt',
  personneReferenteIds: 'pr',
  structurePiloteIds: 'sp',
  servicePiloteIds: 'sv',
  libreTagsIds: 'lt',
  thematiqueIds: 't',
  financeurIds: 'f',
  indicateurIds: 'i',
  cibles: 'c',
  ameliorationContinue: 'ac',
  page: 'p',
  sort: 'sort',
  noPilote: 'ssp',
  noServicePilote: 'sssp',
  noStatut: 'sss',
  noTag: 'nt',
  noPlan: 'np',
  noPriorite: 'npr',
  typePeriode: 'tp',
  debutPeriode: 'dp',
  finPeriode: 'fp',
  modifiedAfter: 'ma',
  hasNoteDeSuivi: 'nds',
  anneesNoteDeSuivi: 'ands',
  sousThematiqueIds: 'st',
  noReferent: 'nr',
  sharedWithCollectivites: 'swc',
};
