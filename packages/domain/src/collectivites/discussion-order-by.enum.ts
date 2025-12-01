import { z } from 'zod/mini';

export const discussionOrderByEnum = {
  ACTION_ID: 'actionId',
  CREATED_AT: 'createdAt',
  CREATED_BY: 'createdBy',
};

export const discussionOrderByEnumSchema = z.enum(discussionOrderByEnum);

export type DiscussionOrderBy =
  (typeof discussionOrderByEnum)[keyof typeof discussionOrderByEnum];
