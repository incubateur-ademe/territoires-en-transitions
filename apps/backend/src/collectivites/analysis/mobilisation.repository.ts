import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { type Result } from '@tet/backend/utils/result.type';
import { CategorieAction, LevierId } from '@tet/domain/shared';
import { type VoletError } from './volet.errors';

export type VoletMobilisation = {
  categorie: CategorieAction;
  note: number;
  ficheIds: number[];
};

export type LevierMobilisation = {
  levierId: LevierId;
  volets: VoletMobilisation[];
};

export type MobilisationRepository = {
  updateMobilisation(input: {
    collectiviteId: number;
    leviers: LevierMobilisation[];
    tx?: Transaction;
  }): Promise<Result<void, VoletError>>;

  getMobilisation(
    collectiviteId: number
  ): Promise<Result<LevierMobilisation[], VoletError>>;
};
