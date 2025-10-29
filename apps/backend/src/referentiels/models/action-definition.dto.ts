import { preuveSchemaEssential } from '@/backend/collectivites/documents/models/preuve.dto';
import { personneTagOrUserSchema } from '@/backend/collectivites/shared/models/personne-tag-or-user.dto';
import { tagWithCollectiviteIdSchema } from '@/backend/collectivites/tags/tag.table-base';
import { scoreFinalSchema } from '@/backend/referentiels/compute-score/score.dto';
import z from 'zod';
import { actionDefinitionSchema } from './action-definition.table';
import { statutAvancementIncludingNonConcerneEnumSchema } from './action-statut.table';
import {
  actionTypeIncludingExempleSchema,
  actionTypeSchema,
} from './action-type.enum';

type RecursiveTreeNode<T> = T & {
  actionsEnfant: RecursiveTreeNode<T>[];
};

export type TreeNode<T> = T extends infer R ? RecursiveTreeNode<R> : never;

export const actionDefinitionEssentialSchema = z.object({
  actionId: z.string(),
  points: z.number().nullable(),
  level: z.number(),
  actionType: actionTypeIncludingExempleSchema,
  // action catalogues include cae, eci but also biodiversite, eau
  tags: z.string().array().optional(),
  preuves: preuveSchemaEssential.array().optional(),
});

export type ActionDefinitionEssential = z.infer<
  typeof actionDefinitionEssentialSchema
>;

export const actionSchema = z.object({
  ...actionDefinitionSchema.shape,

  pilotes: personneTagOrUserSchema.array(),
  services: tagWithCollectiviteIdSchema.array(),
  statut: statutAvancementIncludingNonConcerneEnumSchema.optional(),
  desactive: z.boolean().optional(),
  concerne: z.boolean().optional(),
  depth: z.number().optional(),
  actionType: actionTypeSchema.optional(),
});

export type Action = z.infer<typeof actionSchema>;

const _actionWithScoreSchema = z.object({
  ...actionSchema.shape,
  score: scoreFinalSchema.optional(),
});

export type ActionWithScore = z.infer<typeof _actionWithScoreSchema>;
