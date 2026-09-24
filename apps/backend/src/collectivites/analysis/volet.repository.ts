import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { type Result } from '@tet/backend/utils/result.type';
import { FicheVolet } from './pipeline/calculate-mobilisation/group-volets-by-levier';
import { ClassifiedFiche } from './pipeline/classify-fiches/apply-classification';
import { type VoletError } from './volet.errors';

export type FicheVolets = Pick<ClassifiedFiche, 'ficheId' | 'volets'>;

export type VoletRepository = {
  saveVolets(input: {
    collectiviteId: number;
    fiches: FicheVolets[];
    tx?: Transaction;
  }): Promise<Result<void, VoletError>>;

  listVolets(input: {
    collectiviteId: number;
  }): Promise<Result<FicheVolet[], VoletError>>;

  deleteVolets(input: {
    ficheIds: readonly number[];
    tx?: Transaction;
  }): Promise<Result<void, VoletError>>;
};
