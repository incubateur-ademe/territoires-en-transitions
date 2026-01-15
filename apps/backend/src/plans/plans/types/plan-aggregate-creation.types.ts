import { FicheWithRelationsCreation } from '@tet/backend/plans/fiches/list-fiches/fiche-action-with-relations.dto';

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
  fiches: FicheWithRelationsAndAxisPath[];
}

/**
 * A fiche with its axis path for hierarchical organization
 */
export interface FicheWithRelationsAndAxisPath {
  axisPath?: string[];
  fiche: FicheWithRelationsCreation;
}
