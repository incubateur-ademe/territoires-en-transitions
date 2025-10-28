import {
  CreateDiscussionMessageType,
  DiscussionMessageType,
  Result,
} from '@/backend/collectivites/discussions/domain/discussion.type';
import { Transaction } from '@/backend/utils/database/transaction.utils';

export interface DiscussionMessageRepository {
  create: (
    discussionMessage: CreateDiscussionMessageType,
    tx?: Transaction
  ) => Promise<Result<DiscussionMessageType>>;

  findByDiscussionIds: (
    discussionIds: number[]
  ) => Promise<Result<DiscussionMessageType[]>>;

  delete: (
    discussionMessageId: number,
    tx?: Transaction
  ) => Promise<Result<void>>;
}
