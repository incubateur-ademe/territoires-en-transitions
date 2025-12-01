import { z } from 'zod';

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export const discussionStatus = {
  ALL: 'all',
  OUVERT: 'ouvert',
  FERME: 'ferme',
} as const;

export const discussionStatusValues = [
  discussionStatus.ALL,
  discussionStatus.OUVERT,
  discussionStatus.FERME,
] as const;

export const discussionStatusEnumSchema = z.enum(discussionStatusValues);
export type DiscussionStatus = z.infer<typeof discussionStatusEnumSchema>;

