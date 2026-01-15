/**
 * Plan Domain Types
 *
 * Types métier pour le domaine Plan, validés avec Zod.
 * Ces types représentent les concepts métier purs,
 * sans dépendances vers l'infrastructure ou les frameworks.
 */

import { z } from 'zod';

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

export interface PlanAggregateValidation {
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
