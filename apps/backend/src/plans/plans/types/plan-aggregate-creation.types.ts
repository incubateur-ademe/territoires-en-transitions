import { FicheAggregate } from '@/backend/plans/fiches/domain/fiche.types';

/**
 * Generic request for creating a complete plan with its fiches and axes structure
 * This type is decoupled from any specific feature (import, duplication, templates, etc.)
 */
export interface PlanAggregateCreationRequest {
  collectiviteId: number;
  nom: string;
  typeId?: number;
  pilotes?: Array<{ tagId: number | null; userId: string | null }>;
  referents?: Array<{ tagId: number | null; userId: string | null }>;
  fiches: FicheWithAxisPath[];
}

/**
 * A fiche with its axis path for hierarchical organization
 */
export interface FicheWithAxisPath {
  axisPath: string[];
  fiche: FicheAggregate;
}
