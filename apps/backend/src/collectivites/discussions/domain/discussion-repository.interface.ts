import { Transaction } from '@/backend/utils/database/transaction.utils';
import {
  CreateDiscussionType,
  DiscussionType,
  ListDiscussionsRequestFilters,
  QueryOptionsType,
  ReferentielEnum,
  Result,
} from './discussion.type';

export interface DiscussionRepository {
  create: (
    discussion: CreateDiscussionType,
    tx?: Transaction
  ) => Promise<Result<DiscussionType>>;
  findById: (id: number) => Promise<Result<DiscussionType>>;
  findByCollectiviteIdAndReferentielId: (
    collectiviteId: number,
    referentielId: ReferentielEnum
  ) => Promise<Result<DiscussionType[]>>;
  findOrCreate: (
    discussion: CreateDiscussionType,
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
  ) => Promise<Result<DiscussionType[]>>;
}
