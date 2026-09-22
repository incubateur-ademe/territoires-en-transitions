import { type Transaction } from '@tet/backend/utils/database/transaction.utils';
import { type Result } from '@tet/backend/utils/result.type';
import { PertinenceLevier } from '@tet/domain/collectivites';
import { type PertinenceLeviersRepositoryError } from './pertinence-leviers.errors';

export type UpsertPertinenceInput = PertinenceLevier & {
  collectiviteId: number;
  modifiedBy: string;
  tx?: Transaction;
};

export type PertinenceLeviersRepository = {
  list(
    collectiviteId: number
  ): Promise<Result<PertinenceLevier[], PertinenceLeviersRepositoryError>>;

  upsert(
    input: UpsertPertinenceInput
  ): Promise<Result<void, PertinenceLeviersRepositoryError>>;
};
