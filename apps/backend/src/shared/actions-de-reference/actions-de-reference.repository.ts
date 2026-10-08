import { type Transaction } from '@tet/backend/utils/database/transaction.utils';
import { type Result } from '@tet/backend/utils/result.type';
import {
  ActionDeReference,
  ActionDeReferenceChanges,
  ActionDeReferenceId,
  GetActionDeReferenceInput,
  ListActionsDeReferenceInput,
  UpdateActionDeReferenceOutput,
} from '@tet/domain/shared';
import {
  type GetActionDeReferenceError,
  type ListActionsDeReferenceError,
  type UpdateActionDeReferenceRepositoryError,
} from './actions-de-reference.errors';

export abstract class ActionsDeReferenceRepository {
  abstract list(
    input: ListActionsDeReferenceInput
  ): Promise<Result<ActionDeReference[], ListActionsDeReferenceError>>;

  abstract get(
    input: GetActionDeReferenceInput
  ): Promise<Result<ActionDeReference, GetActionDeReferenceError>>;

  abstract update(input: {
    readonly id: ActionDeReferenceId;
    readonly changes: ActionDeReferenceChanges;
    readonly tx?: Transaction;
  }): Promise<
    Result<
      UpdateActionDeReferenceOutput,
      UpdateActionDeReferenceRepositoryError
    >
  >;
}
