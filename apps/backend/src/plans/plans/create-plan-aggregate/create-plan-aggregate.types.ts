import { SecteursProposes } from '@tet/backend/plans/fiches/fiche-secteurs/secteurs-proposes';
import { Lien, PersonneId } from '@tet/domain/collectivites';
import {
  AxeReference,
  FicheReference,
  PlanEngagements,
} from '@tet/domain/plans';
import { UpdateFicheInput } from '../../fiches/update-fiche/update-fiche.input';

export interface CreatePlanAggregateInput {
  /** Plan déjà créé (vide) à remplir, plutôt qu'un nouveau plan. */
  planId?: number;
  collectiviteId: number;
  nom: string;
  typeId?: number;
  dateDebut?: string | null;
  dateFin?: string | null;
  pilotes?: PersonneId[];
  referents?: PersonneId[];
  /** Sélection résolue du programme, réservée à la création d'un nouveau plan. */
  engagements?: PlanEngagements;
  /** Clés locales à la requête, indépendantes des libellés et des IDs en base. */
  axes: AggregateAxe[];
  fiches: AggregateFiche[];
  existingFiches?: AggregateExistingFiche[];
}

export interface AggregateAxe {
  sourceKey: string;
  parentSourceKey?: string;
  nom: string;
  reference?: AxeReference;
}

export interface AggregateFiche {
  sourceKey: string;
  axeSourceKey?: string;
  parentSourceKey?: string;
  fiche: Omit<UpdateFicheInput, 'id' | 'collectiviteId' | 'parentId' | 'axes'>;
  secteursProposes?: SecteursProposes;
  documents?: Lien[];
  reference?: FicheReference;
}

/** Une fiche existante ne reçoit qu'un lien, jamais des champs à appliquer. */
export interface AggregateExistingFiche {
  sourceKey: string;
  axeSourceKey?: string;
  ficheId: number;
}

export interface CreatePlanAggregateOutput {
  planId: number;
  axeIdsBySourceKey: Map<string, number>;
  ficheIdsBySourceKey: Map<string, number>;
  createdFicheIds: number[];
}
