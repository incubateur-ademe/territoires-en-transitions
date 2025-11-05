import {
  CreateDiscussionData,
  CreateDiscussionMessageResponse,
  DiscussionMessage,
} from '@/backend/collectivites/discussions/presentation/discussion.schemas';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import {
  Discussion,
  DiscussionMessageCreate,
  DiscussionStatus,
} from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { Result } from './discussion.results';

export interface DiscussionRepository {
  create: (
    discussion: CreateDiscussionData,
    tx?: Transaction
  ) => Promise<Result<Discussion>>;
  createDiscussionMessage: (
    discussionMessage: DiscussionMessageCreate,
    tx?: Transaction
  ) => Promise<Result<CreateDiscussionMessageResponse>>;
  findById: (id: number) => Promise<Result<Discussion>>;
  findByCollectiviteIdAndReferentielId: (
    collectiviteId: number,
    referentielId: ReferentielId
  ) => Promise<Result<Discussion[]>>;
  countMessagesDiscussionsByDiscussionId: (
    discussionId: number
  ) => Promise<Result<number>>;
  update: (
    discussionId: number,
    status: DiscussionStatus
  ) => Promise<Result<Discussion>>;
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
