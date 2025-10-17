import {
  CreateDiscussionMessageType,
  DiscussionMessageType,
  Result,
} from './discussion.type';

export interface DiscussionMessageRepository {
  create: (
    discussionMessage: CreateDiscussionMessageType
  ) => Promise<Result<DiscussionMessageType>>;

  findByDiscussionIds: (
    discussionIds: number[]
  ) => Promise<Result<DiscussionMessageType[]>>;

  delete: (discussionMessageId: number) => Promise<Result<void>>;
}
