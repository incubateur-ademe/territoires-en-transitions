import { pgEnum } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export const referentielEnumValues = ['cae', 'eci', 'te', 'te-test'] as const;
export type ReferentielEnum = (typeof referentielEnumValues)[number];

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
export const discussionStatusPgEnum = pgEnum(
  'discussion_statut',
  discussionStatusValues
);
export type DiscussionStatus =
  (typeof discussionStatus)[keyof typeof discussionStatus];
