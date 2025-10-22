import { FilterKeys } from '@/app/plans/fiches/list-all-fiches/filters/types';
import { CountByPropertyEnumType } from '@/domain/plans/fiches';

export const noValueCountByToFilterKeyMapping = {
  priorite: 'noPriorite',
  pilotes: 'noPilote',
  services: 'noServicePilote',
  referents: 'noReferent',
  libreTags: 'noTag',
  statut: 'noStatut',
  plans: 'noPlan',
} as const satisfies Partial<Record<CountByPropertyEnumType, FilterKeys>>;

export const generalCountByToFilterKeyMapping = {
  statut: 'statuts',
  priorite: 'priorites',
  libreTags: 'libreTagsIds',
  cibles: 'cibles',
  financeurs: 'financeurIds',
  thematiques: 'thematiqueIds',
  indicateurs: 'hasIndicateurLies',
  structures: 'structurePiloteIds',
  services: 'servicePiloteIds',
  actionsParMesuresDeReferentiels: 'hasMesuresLiees',
  restreint: 'restreint',
  ameliorationContinue: 'ameliorationContinue',
  partenaires: 'partenaireIds',
  plans: 'planActionIds',
  sousThematiques: 'sousThematiqueIds',
  notes: 'hasNoteDeSuivi',
} as const satisfies Partial<Record<CountByPropertyEnumType, FilterKeys>>;
