import {
  PrioriteOrNot,
  StatutOrNot,
} from '@/app/plans/fiches/list-all-fiches/filters/types';
import {
  EN_COURS_SANS_AVANCEMENT_LABEL,
  listFichesRequestFiltersObjectSchema,
  NON_MODIFIEE_DEPUIS_PLUS_D_UN_AN_LABEL,
  Priorite,
  SANS_PILOTE_LABEL,
  SANS_REFERENT_LABEL,
  Statut,
} from '@tet/domain/plans';
import { z } from 'zod';

export type Filters = {
  collectiviteId: number;
  axes?: number[];
  noPlan?: boolean;
  pilotes?: string[];
  noPilote?: boolean;
  referents?: string[];
  noReferent?: boolean;
  statuts?: Statut[];
  noStatut?: boolean;
  priorites?: Priorite[];
  noPriorite?: boolean;
  enCoursSansAvancement?: boolean;
  notModifiedForOverAYear?: boolean;
  page?: number;
};

export type FormFilters = {
  collectiviteId: number;
  axes: number[];
  priorites?: PrioriteOrNot[];
  statuts?: StatutOrNot[];
  referents?: ReferentOrNot[];
  pilotes?: PiloteOrNot[];
  suivi?: SuiviOption[];
};

export type SuiviOption =
  | typeof EN_COURS_SANS_AVANCEMENT_LABEL
  | typeof NON_MODIFIEE_DEPUIS_PLUS_D_UN_AN_LABEL;

type ReferentOrNot = string | typeof SANS_REFERENT_LABEL;
type PiloteOrNot = string | typeof SANS_PILOTE_LABEL;

export const queryPayloadSchema = listFichesRequestFiltersObjectSchema.pick({
  noPilote: true,
  noReferent: true,
  noStatut: true,
  noPriorite: true,
  noPlan: true,
  personnePiloteIds: true,
  personneReferenteIds: true,
  utilisateurPiloteIds: true,
  utilisateurReferentIds: true,
  statuts: true,
  priorites: true,
  enCoursSansAvancement: true,
  notModifiedForOverAYear: true,
});
export type QueryPayload = z.infer<typeof queryPayloadSchema>;
