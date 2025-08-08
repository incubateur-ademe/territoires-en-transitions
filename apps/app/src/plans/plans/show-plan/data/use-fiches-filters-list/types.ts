import {
  TFicheActionEcheances,
  TFicheActionNiveauxPriorite,
  TFicheActionStatuts,
} from '@/app/types/alias';
import {
  listFichesRequestFiltersSchema,
  SANS_PILOTE_LABEL,
  SANS_PRIORITE_LABEL,
  SANS_REFERENT_LABEL,
  SANS_STATUT_LABEL,
} from '@/domain/plans/fiches';
import { z } from 'zod';

export type Filters = {
  collectiviteId: number;
  axes?: number[];
  noPlan?: boolean;
  pilotes?: string[];
  noPilote?: boolean;
  referents?: string[];
  noReferent?: boolean;
  statuts?: TFicheActionStatuts[];
  noStatut?: boolean;
  priorites?: TFicheActionNiveauxPriorite[];
  noPriorite?: boolean;
  echeance?: TFicheActionEcheances;
  page?: number;
};

export type FormFilters = {
  collectiviteId: number;
  axes: number[];
  priorites?: PrioriteOrNot[];
  statuts?: StatutOrNot[];
  referents?: ReferentOrNot[];
  pilotes?: PiloteOrNot[];
};

export type PrioriteOrNot =
  | TFicheActionNiveauxPriorite
  | typeof SANS_PRIORITE_LABEL;
export type StatutOrNot = TFicheActionStatuts | typeof SANS_STATUT_LABEL;
export type ReferentOrNot = string | typeof SANS_REFERENT_LABEL;
export type PiloteOrNot = string | typeof SANS_PILOTE_LABEL;

export const queryPayloadSchema = listFichesRequestFiltersSchema.pick({
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
});
export type QueryPayload = z.infer<typeof queryPayloadSchema>;
