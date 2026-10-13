import { type Transaction } from '@tet/backend/utils/database/transaction.utils';
import { type Result } from '@tet/backend/utils/result.type';
import { ActionDeReferenceId } from '@tet/domain/shared';
import {
  type ListFicheIdsActionDeReferenceError,
  type ListFicheParentsError,
  type ReplaceFichesError,
} from './actions-de-reference.errors';

export type FicheParent = {
  readonly id: number;
  readonly parentId: number | null;
};

export abstract class ActionDeReferenceFicheRepository {
  abstract listFicheIds(input: {
    readonly actionDeReferenceId: ActionDeReferenceId;
    readonly excludedCollectiviteId?: number;
    readonly tx?: Transaction;
  }): Promise<Result<number[], ListFicheIdsActionDeReferenceError>>;

  abstract listFicheParents(input: {
    readonly ficheIds: readonly number[];
    readonly tx?: Transaction;
  }): Promise<Result<FicheParent[], ListFicheParentsError>>;

  abstract replaceFiches(input: {
    readonly actionDeReferenceId: ActionDeReferenceId;
    readonly ficheIds: readonly number[];
    readonly tx?: Transaction;
  }): Promise<Result<void, ReplaceFichesError>>;
}
