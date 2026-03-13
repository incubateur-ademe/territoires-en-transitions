import {
  PersonneTagOrUser,
  TagWithCollectiviteId,
} from '@tet/domain/collectivites';
import {
  ActionType,
  ReferentielId,
  StatutAvancementIncludingNonConcerne,
} from '@tet/domain/referentiels';

export interface ReferentielTableRow {
  id: string;
  collectiviteId: number;
  referentielId: ReferentielId;
  description?: string;
  actionId: string;
  identifiant: string;
  nom: string;
  depth: number;
  type: ActionType;
  scoreRealise?: number;
  scoreProgramme?: number;
  scorePasFait?: number;
  pointRestant?: number;
  pointsPasFait?: number;
  pointFait?: number;
  pointProgramme?: number;
  pointPotentiel?: number;
  phase?: string;
  statut?: StatutAvancementIncludingNonConcerne;
  children?: ReferentielTableRow[];
  explication?: string;
  personnesPilotes?: PersonneTagOrUser[];
  servicesPilotes?: TagWithCollectiviteId[];
  countDocuments?: number;
  countActions?: number;
  countComments?: number;
}

export interface ReferentielTableProps {
  data: ReferentielTableRow[];
  isLoading?: boolean;
}
