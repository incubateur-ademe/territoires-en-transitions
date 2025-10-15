import { Enums } from '@/api';
import {
  listFichesRequestFiltersSchema,
  Priorite,
  SANS_PILOTE_LABEL,
  SANS_PRIORITE_LABEL,
  SANS_REFERENT_LABEL,
  SANS_STATUT_LABEL,
  Statut,
} from '@/domain/plans/fiches';
import { z } from 'zod';

type TFicheActionEcheances = Enums<'fiche_action_echeances'>;

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

export type PrioriteOrNot = Priorite | typeof SANS_PRIORITE_LABEL;
export type StatutOrNot = Statut | typeof SANS_STATUT_LABEL;
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
