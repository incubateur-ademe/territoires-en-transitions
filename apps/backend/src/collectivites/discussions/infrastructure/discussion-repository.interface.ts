import {
  CreateDiscussionData,
  DiscussionStatut,
  DiscussionType,
  DiscussionWithActionName,
  ListDiscussionsRequestFilters,
  QueryOptionsType,
  ReferentielEnum,
  Result,
} from '@/backend/collectivites/discussions/domain/discussion.type';
import { Transaction } from '@/backend/utils/database/transaction.utils';

export interface DiscussionRepository {
  create: (
    discussion: CreateDiscussionData,
    tx?: Transaction
  ) => Promise<Result<DiscussionType>>;
  findById: (id: number) => Promise<Result<DiscussionType>>;
  findByCollectiviteIdAndReferentielId: (
    collectiviteId: number,
    referentielId: ReferentielEnum
  ) => Promise<Result<DiscussionType[]>>;
  findOrCreate: (
    discussion: CreateDiscussionData,
    tx?: Transaction
  ) => Promise<Result<DiscussionType>>;
  findByCollectiviteAndAction: (
    collectiviteId: number,
    actionId: string,
    tx?: Transaction
  ) => Promise<Result<DiscussionType>>;
  list: (
    collectiviteId: number,
    referentielId: ReferentielEnum,
    filters?: ListDiscussionsRequestFilters,
    options?: QueryOptionsType
  ) => Promise<Result<DiscussionWithActionName[]>>;
  update: (
    discussionId: number,
    status: DiscussionStatut
  ) => Promise<Result<DiscussionType>>;
}
