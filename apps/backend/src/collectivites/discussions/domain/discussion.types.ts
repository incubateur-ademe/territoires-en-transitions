import { pgEnum } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { DiscussionMessage } from '../infrastructure/discussion.tables';

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export const referentielEnumValues = ['cae', 'eci', 'te', 'te-test'] as const;
export type ReferentielEnum = (typeof referentielEnumValues)[number];

export const DiscussionStatutEnum = {
  OUVERT: 'ouvert',
  FERME: 'ferme',
} as const;

export const discussionStatutEnumValues = [
  DiscussionStatutEnum.OUVERT,
  DiscussionStatutEnum.FERME,
] as const;

export const discussionStatutEnumSchema = z.enum(discussionStatutEnumValues);
export const discussionStatutPgEnum = pgEnum(
  'discussion_statut',
  discussionStatutEnumValues
);
export type DiscussionStatut = z.infer<typeof discussionStatutEnumSchema>;

// ============================================================================
// REQUEST TYPES
// ============================================================================

export type CreateDiscussionData = {
  message: string;
  discussionId?: number;
  actionId: string;
  collectiviteId: number;
  createdBy: string;
};

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export type CreateDiscussionResponse = {
  id: number;
  messageId: number;
  collectiviteId: number;
  actionId: string;
  message: string;
  status: string;
  createdBy: string;
  createdAt: string;
};

export type CreateDiscussionMessageResponse = {
  id: number;
  discussionId: number;
  message: string;
  createdBy: string;
  createdAt: string;
};

export type DiscussionMessages = {
  id: number;
  collectiviteId: number;
  actionId: string;
  actionNom: string;
  actionIdentifiant: string;
  status: string;
  createdBy: string;
  createdAt: string;
  messages: DiscussionMessage[];
};

export type Discussion = {
  data: DiscussionMessages[];
  count: number;
};
