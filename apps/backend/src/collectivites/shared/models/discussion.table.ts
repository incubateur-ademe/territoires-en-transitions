import { actionIdVarchar } from '@/backend/referentiels/models/action-definition.table';
import { modifiedAt, modifiedBy } from '@/backend/utils/column.utils';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import z from 'zod';


export const DiscussionStatutEnum = {
  OUVERT: 'ouvert',
  FERME: 'ferme',
} as const;

export const discussionStatutEnumValues = [
  DiscussionStatutEnum.OUVERT,
  DiscussionStatutEnum.FERME,
] as const;

export const discussionStatutEnumSchema = z.enum(discussionStatutEnumValues);
export const discussionStatutPgEnum = pgEnum('discussion_statut', discussionStatutEnumValues);
export type DiscussionStatut = z.infer<typeof discussionStatutEnumSchema>;

export const discussionTable = pgTable(
  'discussion',
  {
    id: serial('id').primaryKey().notNull(),
    collectiviteId: integer('collectivite_id').notNull(),
    actionId: actionIdVarchar.notNull(),
    status: discussionStatutPgEnum('status').notNull(),
    message: text('message').notNull(),
    modifiedBy,
    modifiedAt,
  }
);

export type DiscussionType = InferSelectModel<
  typeof discussionTable
>;
export type CreateDiscussionTypeType = InferInsertModel<
  typeof discussionTable
>;

export const discussionSchema = createSelectSchema(
  discussionTable
);
export const createDiscussionSchema = createInsertSchema(
  discussionTable
);

