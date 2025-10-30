import {
  CreateDiscussionMessageType,
  DiscussionMessage,
  Result,
} from '@/backend/collectivites/discussions/domain/discussion.type';
import { Transaction } from '@/backend/utils/database/transaction.utils';

export interface DiscussionMessageRepository {
  create: (
    discussionMessage: CreateDiscussionMessageType,
    tx?: Transaction
  ) => Promise<Result<DiscussionMessage>>;

  findByDiscussionIds: (
    discussionIds: number[]
  ) => Promise<Result<DiscussionMessage[]>>;

  delete: (
    discussionMessageId: number,
    tx?: Transaction
  ) => Promise<Result<void>>;
}
