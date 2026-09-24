import { type Transaction } from '@tet/backend/utils/database/transaction.utils';
import { type Result } from '@tet/backend/utils/result.type';
import { Pertinence, PertinenceLevier } from '@tet/domain/collectivites';
import { LevierId } from '@tet/domain/shared';
import { type PertinenceLeviersRepositoryError } from './pertinence-leviers.errors';

export type UpsertPertinenceInput = PertinenceLevier & {
  collectiviteId: number;
  modifiedBy: string;
  tx?: Transaction;
};

export type LevierPertinenceTarget = {
  collectiviteId: number;
  levierId: LevierId;
  tx?: Transaction;
};

export type PertinenceLeviersRepository = {
  list(
    collectiviteId: number
  ): Promise<Result<PertinenceLevier[], PertinenceLeviersRepositoryError>>;

  getLevierPertinence(
    target: LevierPertinenceTarget
  ): Promise<Result<Pertinence | undefined, PertinenceLeviersRepositoryError>>;

  upsert(
    input: UpsertPertinenceInput
  ): Promise<Result<void, PertinenceLeviersRepositoryError>>;

  deleteCategoriePertinences(
    target: LevierPertinenceTarget
  ): Promise<Result<void, PertinenceLeviersRepositoryError>>;
};
