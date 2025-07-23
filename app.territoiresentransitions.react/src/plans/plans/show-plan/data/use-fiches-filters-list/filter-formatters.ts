import { RouterInput } from '@/api/utils/trpc/client';
import {
  TFicheActionNiveauxPriorite,
  TFicheActionStatuts,
} from '@/app/types/alias';
import {
  SANS_PILOTE_LABEL,
  SANS_PRIORITE_LABEL,
  SANS_REFERENT_LABEL,
  SANS_STATUT_LABEL,
} from '@/backend/plans/fiches/shared/labels';
import { Filters, PrioriteOrNot, RawFilters, StatutOrNot } from './types';

export const fromSearchParameterFormat = (filters: RawFilters): Filters => {
  const priorites = [
    ...(filters.priorites ?? []),
    ...((filters.sans_niveau?.includes('1') === true
      ? [SANS_PRIORITE_LABEL]
      : []) as PrioriteOrNot[]),
  ];

  const statuts = [
    ...(filters.statuts ?? []),
    ...((filters.sans_statut?.includes('1') === true
      ? [SANS_STATUT_LABEL]
      : []) as StatutOrNot[]),
  ];

  const referents = [
    ...(filters.referents ?? []),
    ...(filters.sans_referent?.includes('1') === true
      ? [SANS_REFERENT_LABEL]
      : []),
  ];

  const pilotes = [
    ...(filters.pilotes ?? []),
    ...(filters.sans_pilote?.includes('1') === true ? [SANS_PILOTE_LABEL] : []),
  ];

  return {
    collectivite_id: filters.collectivite_id,
    axes: filters.axes ?? [],
    ...(priorites.length > 0 && { priorites }),
    ...(statuts.length > 0 && { statuts }),
    ...(referents.length > 0 && { referents }),
    ...(pilotes.length > 0 && { pilotes }),
  };
};

export const toSearchParameterFormat = (filters: Filters): RawFilters => {
  const { collectivite_id, axes, priorites, statuts, referents, pilotes } =
    filters;

  const isSansPriorite = priorites?.includes(SANS_PRIORITE_LABEL);
  const prioritesValues = priorites?.filter((p) => p !== SANS_PRIORITE_LABEL);

  const isSansStatut = statuts?.includes(SANS_STATUT_LABEL);
  const statutsValues = statuts?.filter((s) => s !== SANS_STATUT_LABEL);
  const isSansReferent = referents?.includes(SANS_REFERENT_LABEL);
  const referentsValues = referents?.filter((r) => r !== SANS_REFERENT_LABEL);

  const isSansPilote = pilotes?.includes(SANS_PILOTE_LABEL);
  const pilotesValues = pilotes?.filter((p) => p !== SANS_PILOTE_LABEL);

  return {
    collectivite_id,
    ...(axes.length > 0 && { axes }),
    ...(prioritesValues &&
      prioritesValues.length > 0 && {
        priorites: prioritesValues as TFicheActionNiveauxPriorite[],
      }),
    ...(isSansPriorite && { sans_niveau: ['1'] }),
    ...(statutsValues &&
      statutsValues.length > 0 && {
        statuts: statutsValues as TFicheActionStatuts[],
      }),
    ...(isSansStatut && { sans_statut: ['1'] }),
    ...(referentsValues &&
      referentsValues.length > 0 && {
        referents: referentsValues,
      }),
    ...(isSansReferent && { sans_referent: ['1'] }),
    ...(pilotesValues &&
      pilotesValues.length > 0 && { pilotes: pilotesValues }),
    ...(isSansPilote && { sans_pilote: ['1'] }),
  };
};

export const toQueryPayload = (
  filters: RawFilters
): RouterInput['plans']['fiches']['listResumes']['filters'] => {
  return {
    statuts: filters.statuts,
    noStatut: filters.sans_statut?.includes('1') ? true : undefined,

    priorites: filters.priorites,
    noPriorite: filters.sans_niveau?.includes('1') ? true : undefined,

    utilisateurReferentIds: filters.referents?.filter((r) => r.includes('-')), // Si UUID alors user
    personneReferenteIds: filters.referents
      ?.filter((r) => !r.includes('-'))
      .map(Number),
    noReferent: filters.sans_referent?.includes('1') ? true : undefined,

    utilisateurPiloteIds: filters.pilotes?.filter((p) => p.includes('-')),
    personnePiloteIds: filters.pilotes
      ?.filter((p) => !p.includes('-'))
      .map(Number),
    noPilote: filters.sans_pilote?.includes('1') ? true : undefined,
  };
};
