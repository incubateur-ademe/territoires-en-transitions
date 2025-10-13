import { pgEnum } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export const referentielEnumValues = ['cae', 'eci', 'te', 'te-test'] as const;
export type ReferentielEnum = (typeof referentielEnumValues)[number];

export const DiscussionStatutEnum = {
  ALL: 'all',
  OUVERT: 'ouvert',
  FERME: 'ferme',
} as const;

export const discussionStatusEnumValues = [
  DiscussionStatutEnum.ALL,
  DiscussionStatutEnum.OUVERT,
  DiscussionStatutEnum.FERME,
] as const;

export const discussionStatusEnumSchema = z.enum(discussionStatusEnumValues);
export const discussionStatusPgEnum = pgEnum(
  'discussion_statut',
  discussionStatusEnumValues
);
export type DiscussionStatus = z.infer<typeof discussionStatusEnumSchema>;
