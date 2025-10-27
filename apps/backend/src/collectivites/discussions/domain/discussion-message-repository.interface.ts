import { Transaction } from '@/backend/utils/database/transaction.utils';
import {
  CreateDiscussionMessageType,
  DiscussionMessageType,
  Result,
} from './discussion.type';

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
