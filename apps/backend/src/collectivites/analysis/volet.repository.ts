import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { type Result } from '@tet/backend/utils/result.type';
import { ClassifiedFiche } from './pipeline/classify-fiches/apply-classification';
import { type VoletError } from './volet.errors';

export type FicheVolets = Pick<ClassifiedFiche, 'ficheId' | 'volets'>;

export type VoletRepository = {
  saveVolets(input: {
    collectiviteId: number;
    fiches: FicheVolets[];
    createdBy: string;
    tx?: Transaction;
  }): Promise<Result<void, VoletError>>;
};
