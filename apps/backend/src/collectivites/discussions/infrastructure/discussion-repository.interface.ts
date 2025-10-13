import {
  CreateDiscussionData,
  CreateDiscussionMessageResponse,
  DiscussionStatut,
  ReferentielEnum,
} from '@/backend/collectivites/discussions/domain/discussion.types';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Result } from './discussion.results';
import {
  CreateDiscussionMessageType,
  DiscussionMessage,
  DiscussionType,
} from './discussion.tables';

export interface DiscussionRepository {
  create: (
    discussion: CreateDiscussionData,
    tx?: Transaction
  ) => Promise<Result<DiscussionType>>;
  createDiscussionMessage: (
    discussionMessage: CreateDiscussionMessageType,
    tx?: Transaction
  ) => Promise<Result<CreateDiscussionMessageResponse>>;
  findById: (id: number) => Promise<Result<DiscussionType>>;
  findByCollectiviteIdAndReferentielId: (
    collectiviteId: number,
    referentielId: ReferentielEnum
  ) => Promise<Result<DiscussionType[]>>;
  update: (
    discussionId: number,
    status: DiscussionStatut
  ) => Promise<Result<DiscussionType>>;
  deleteDiscussionAndDiscussionMessage: (
    discussionId: number,
    tx?: Transaction
  ) => Promise<Result<void>>;
  deleteDiscussionMessage: (messageId: number) => Promise<Result<void>>;
  updateDiscussionMessage: (
    messageId: number,
    message: string
  ) => Promise<Result<DiscussionMessage>>;
}
