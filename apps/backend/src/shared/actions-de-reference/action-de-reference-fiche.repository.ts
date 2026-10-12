import { type Transaction } from '@tet/backend/utils/database/transaction.utils';
import { type Result } from '@tet/backend/utils/result.type';
import { ActionDeReferenceId } from '@tet/domain/shared';
import { type ListFicheIdsActionDeReferenceError } from './actions-de-reference.errors';

export abstract class ActionDeReferenceFicheRepository {
  abstract listFicheIds(input: {
    readonly actionDeReferenceId: ActionDeReferenceId;
    readonly tx?: Transaction;
  }): Promise<Result<number[], ListFicheIdsActionDeReferenceError>>;
}
