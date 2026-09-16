import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { type Result } from '@tet/backend/utils/result.type';
import { CategorieAction, LevierId } from '@tet/domain/shared';
import { ScoredVolet } from './pipeline/calculate-mobilisation/calculate-mobilisation';
import { type VoletError } from './volet.errors';

export type ScoredLevier = {
  levierId: LevierId;
  volets: ScoredVolet[];
};

export type GridVolet = {
  categorie: CategorieAction;
  note: number;
  ficheIds: number[];
};

export type LevierGrid = {
  levierId: LevierId;
  volets: GridVolet[];
};

export type GridRepository = {
  replaceGrid(input: {
    collectiviteId: number;
    leviers: ScoredLevier[];
    tx?: Transaction;
  }): Promise<Result<void, VoletError>>;

  getGrid(collectiviteId: number): Promise<Result<LevierGrid[], VoletError>>;
};
