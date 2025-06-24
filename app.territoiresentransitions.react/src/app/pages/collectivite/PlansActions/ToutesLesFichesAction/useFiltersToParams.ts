import { ListFichesRequestFilters as Filtres } from '@/domain/plans/fiches';



export const useFiltersToParams = () => {
  /** Convertit les paramètres d'URL en filtres */
  const convertParamsToFilters = (paramFilters: Filtres) => {
    if (paramFilters.modifiedSince && Array.isArray(paramFilters.modifiedSince)) {
      paramFilters.modifiedSince = paramFilters.modifiedSince[0];
    }
    if (paramFilters.debutPeriode && Array.isArray(paramFilters.debutPeriode)) {
      paramFilters.debutPeriode = paramFilters.debutPeriode[0];
    }
    if (paramFilters.finPeriode && Array.isArray(paramFilters.finPeriode)) {
      paramFilters.finPeriode = paramFilters.finPeriode[0];
    }
    if (paramFilters.typePeriode && Array.isArray(paramFilters.typePeriode)) {
      paramFilters.typePeriode = paramFilters.typePeriode[0];
    }
    if (paramFilters.typePeriode && Array.isArray(paramFilters.typePeriode)) {
      paramFilters.typePeriode = paramFilters.typePeriode[0];
    }
    if (paramFilters.debutPeriode && Array.isArray(paramFilters.debutPeriode)) {
      paramFilters.debutPeriode = paramFilters.debutPeriode[0];
    }
    if (paramFilters.finPeriode && Array.isArray(paramFilters.finPeriode)) {
      paramFilters.finPeriode = paramFilters.finPeriode[0];
    }
    if (paramFilters.hasMesuresLiees && Array.isArray(paramFilters.hasMesuresLiees)) {
      paramFilters.hasMesuresLiees =
        paramFilters.hasMesuresLiees[0] === 'true' ? true : false;
    }
    if (paramFilters.hasNoteDeSuivi && Array.isArray(paramFilters.hasNoteDeSuivi)) {
      paramFilters.hasNoteDeSuivi =
        paramFilters.hasNoteDeSuivi[0] === 'true' ? true : false;
    }
    if (paramFilters.isBelongsToSeveralPlans && Array.isArray(paramFilters.isBelongsToSeveralPlans)) {
      paramFilters.isBelongsToSeveralPlans =
        paramFilters.isBelongsToSeveralPlans[0] === 'true' ? true : false;
    }
    if (paramFilters.noPriorite && Array.isArray(paramFilters.noPriorite)) {
      paramFilters.noPriorite =
        paramFilters.noPriorite[0] === 'true' ? true : false;
    }
    if (paramFilters.noTag && Array.isArray(paramFilters.noTag)) {
      paramFilters.noTag =
        paramFilters.noTag[0] === 'true' ? true : false;
    }
    if (paramFilters.noStatut && Array.isArray(paramFilters.noStatut)) {
      paramFilters.noStatut =
        paramFilters.noStatut[0] === 'true' ? true : false;
    }
    if (paramFilters.noReferent && Array.isArray(paramFilters.noReferent)) {
      paramFilters.noReferent =
        paramFilters.noReferent[0] === 'true' ? true : false;
    }
    if (paramFilters.noServicePilote && Array.isArray(paramFilters.noServicePilote)) {
      paramFilters.noServicePilote =
        paramFilters.noServicePilote[0] === 'true' ? true : false;
    }
    if (paramFilters.noPilote && Array.isArray(paramFilters.noPilote)) {
      paramFilters.noPilote =
        paramFilters.noPilote[0] === 'true' ? true : false;
    }
    if (paramFilters.restreint && Array.isArray(paramFilters.restreint)) {
      paramFilters.restreint =
        paramFilters.restreint[0] === 'true' ? true : false;
    }
    if (paramFilters.ameliorationContinue && Array.isArray(paramFilters.ameliorationContinue)) {
      paramFilters.ameliorationContinue =
        paramFilters.ameliorationContinue[0] === 'true' ? true : false;
    }
    if (paramFilters.hasDateDeFinPrevisionnelle && Array.isArray(paramFilters.hasDateDeFinPrevisionnelle)) {
      paramFilters.hasDateDeFinPrevisionnelle =
        paramFilters.hasDateDeFinPrevisionnelle[0] === 'true' ? true : false;
    }
    return paramFilters;
  };

  const removeFalsyElementFromFilters = (filters: Filtres) => {
    const newFilters: Filtres = filters;
    for (const key of Object.keys(newFilters) as (keyof Filtres)[]) {
      if ((newFilters[key] === undefined)) {
        delete newFilters[key];
      }
    }
    return newFilters;
  };


  /** Paramètres d'URL possibles pour les filtres de fiches action */
  type FicheActionParam =
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
    | 'nr';


  const nameToparams: Record<
    keyof Filtres | 'sort' | 'page',
    FicheActionParam
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
    isBelongsToSeveralPlans: 'iitop',
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
  };

  return {
    convertParamsToFilters,
    removeFalsyElementFromFilters,
    nameToparams,
  }
}
