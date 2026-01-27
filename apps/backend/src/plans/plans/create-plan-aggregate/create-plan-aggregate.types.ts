import { z } from 'zod';
import { UpdateFicheInput } from '../../fiches/update-fiche/update-fiche.input';

export const PlanParticipantSchema = z
  .object({
    tagId: z.number().nullable(),
    userId: z.string().nullable(),
  })
  .refine((data) => data.tagId !== null || data.userId !== null, {
    message: 'Au moins tagId ou userId doit être non-null',
  });

const _AxisPathSchema = z.array(z.string().min(1));

export type AxisPath = z.infer<typeof _AxisPathSchema>;

export const PlanCreationDataSchema = z.object({
  collectiviteId: z.number().int().positive(),
  nom: z.string().min(1, 'Le nom du plan ne peut pas être vide').max(300),
  typeId: z.number().int().positive().optional(),
  pilotes: z.array(PlanParticipantSchema).optional(),
  referents: z.array(PlanParticipantSchema).optional(),
});

export type PlanCreationData = z.infer<typeof PlanCreationDataSchema>;

export interface AxeWithPath {
  path: string[];
  nom: string;
  collectiviteId: number;
  planId: number;
}

export interface CreatePlanAggregateValidation {
  isValid: boolean;
  errors: string[];
}

export interface AxeHierarchyValidation {
  isValid: boolean;
  missingParents: string[][];
  orphanedPaths: string[][];
}

export interface UniqueAxe {
  path: string[];
  fullPath: string;
  depth: number;
  parentPath?: string[];
}

export interface CreatePlanAggregateInput {
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
  fiche: Omit<UpdateFicheInput, 'collectiviteId'>;
}
