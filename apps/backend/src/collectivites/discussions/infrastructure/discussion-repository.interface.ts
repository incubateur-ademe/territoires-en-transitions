import {
  CreateDiscussionData,
  CreateDiscussionMessageResponse,
} from '@tet/backend/collectivites/discussions/presentation/discussion.schemas';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  Discussion,
  DiscussionMessage,
  DiscussionMessageCreate,
  DiscussionStatus,
} from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { DiscussionResult } from './discussion.results';

export interface DiscussionRepository {
  create: (
    discussion: CreateDiscussionData,
    tx?: Transaction
  ) => Promise<DiscussionResult<Discussion>>;
  createDiscussionMessage: (
    discussionMessage: DiscussionMessageCreate,
    tx?: Transaction
  ) => Promise<DiscussionResult<CreateDiscussionMessageResponse>>;
  findById: (id: number) => Promise<DiscussionResult<Discussion>>;
  findByCollectiviteIdAndReferentielId: (
    collectiviteId: number,
    referentielId: ReferentielId
  ) => Promise<DiscussionResult<Discussion[]>>;
  countMessagesDiscussionsByDiscussionId: (
    discussionId: number
  ) => Promise<DiscussionResult<number>>;
  update: (
    discussionId: number,
    status: DiscussionStatus
  ) => Promise<DiscussionResult<Discussion>>;
  deleteDiscussionAndDiscussionMessage: (
    discussionId: number,
    tx?: Transaction
  ) => Promise<DiscussionResult<void>>;
  deleteDiscussionMessage: (
    messageId: number
  ) => Promise<DiscussionResult<void>>;
  updateDiscussionMessage: (
    messageId: number,
    message: string
  ) => Promise<DiscussionResult<DiscussionMessage>>;
}
