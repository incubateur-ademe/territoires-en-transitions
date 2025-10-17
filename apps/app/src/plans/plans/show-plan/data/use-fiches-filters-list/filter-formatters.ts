import {
  SANS_PILOTE_LABEL,
  SANS_PRIORITE_LABEL,
  SANS_REFERENT_LABEL,
  SANS_STATUT_LABEL,
} from '@/domain/plans';
import { Filters, FormFilters, QueryPayload } from './types';

export const toFilters = (filters: Filters): FormFilters => {
  const priorites = [
    ...(filters.priorites ?? []),
    ...(filters.noPriorite ? [SANS_PRIORITE_LABEL] : []),
  ];

  const statuts = [
    ...(filters.statuts ?? []),
    ...(filters.noStatut ? [SANS_STATUT_LABEL] : []),
  ];

  const referents = [
    ...(filters.referents ?? []),
    ...(filters.noReferent ? [SANS_REFERENT_LABEL] : []),
  ];

  const pilotes = [
    ...(filters.pilotes ?? []),
    ...(filters.noPilote ? [SANS_PILOTE_LABEL] : []),
  ];

  return {
    collectiviteId: filters.collectiviteId,
    axes: filters.axes ?? [],
    ...(priorites.length > 0 && { priorites }),
    ...(statuts.length > 0 && { statuts }),
    ...(referents.length > 0 && { referents }),
    ...(pilotes.length > 0 && { pilotes }),
  };
};

export const splitReferentsAndPilotesIds = (filters: FormFilters): Filters => {
  const { collectiviteId, axes, priorites, statuts, referents, pilotes } =
    filters;

  const withNoPriorite = priorites?.includes(SANS_PRIORITE_LABEL);
  const prioritesValues = priorites?.filter((p) => p !== SANS_PRIORITE_LABEL);

  const withNoStatus = statuts?.includes(SANS_STATUT_LABEL);
  const statutsValues = statuts?.filter((s) => s !== SANS_STATUT_LABEL);
  const withNoReferent = referents?.includes(SANS_REFERENT_LABEL);
  const referentsValues = referents?.filter((r) => r !== SANS_REFERENT_LABEL);

  const withNoPilote = pilotes?.includes(SANS_PILOTE_LABEL);
  const pilotesValues = pilotes?.filter((p) => p !== SANS_PILOTE_LABEL);

  return {
    collectiviteId,
    ...(axes.length > 0 && { axes }),
    ...(prioritesValues &&
      prioritesValues.length > 0 && {
        priorites: prioritesValues,
      }),
    ...(withNoPriorite && { noPriorite: true }),
    ...(statutsValues &&
      statutsValues.length > 0 && {
        statuts: statutsValues,
      }),
    ...(withNoStatus && { noStatut: true }),
    ...(referentsValues &&
      referentsValues.length > 0 && {
        referents: referentsValues,
      }),
    ...(withNoReferent && { noReferent: true }),
    ...(pilotesValues &&
      pilotesValues.length > 0 && { pilotes: pilotesValues }),
    ...(withNoPilote && { noPilote: true }),
  };
};

export const toQueryPayload = (filters: Filters): QueryPayload => {
  const { collectiviteId, axes, referents, pilotes, ...rest } = filters;
  return {
    ...rest,
    utilisateurReferentIds: filters.referents?.filter((r) => r.includes('-')),
    personneReferenteIds: filters.referents
      ?.filter((r) => !r.includes('-'))
      .map(Number),
    noReferent: filters.noReferent,

    utilisateurPiloteIds: filters.pilotes?.filter((p) => p.includes('-')),
    personnePiloteIds: filters.pilotes
      ?.filter((p) => !p.includes('-'))
      .map(Number),
  };
};
