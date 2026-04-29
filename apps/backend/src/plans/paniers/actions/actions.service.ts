import { Injectable } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { PanierRepository } from '../shared/panier.repository';
import {
  PanierActionsError,
  PanierActionsErrorEnum,
} from './actions.errors';
import { PanierActionInput, SetActionStatusInput } from './actions.input';
import { PanierActionsRepository } from './actions.repository';

@Injectable()
export class PanierActionsService {
  constructor(
    private readonly panierRepository: PanierRepository,
    private readonly actionsRepository: PanierActionsRepository
  ) {}

  async addAction(
    input: PanierActionInput,
    tx?: Transaction
  ): Promise<Result<void, PanierActionsError>> {
    const exists = await this.panierRepository.exists(input.panierId, tx);
    if (!exists) {
      return failure(PanierActionsErrorEnum.PANIER_NOT_FOUND);
    }
    await this.actionsRepository.addAction(input, tx);
    return success(undefined);
  }

  async removeAction(
    input: PanierActionInput,
    tx?: Transaction
  ): Promise<Result<void, PanierActionsError>> {
    const exists = await this.panierRepository.exists(input.panierId, tx);
    if (!exists) {
      return failure(PanierActionsErrorEnum.PANIER_NOT_FOUND);
    }
    await this.actionsRepository.removeAction(input, tx);
    return success(undefined);
  }

  async setStatus(
    input: SetActionStatusInput,
    tx?: Transaction
  ): Promise<Result<void, PanierActionsError>> {
    const exists = await this.panierRepository.exists(input.panierId, tx);
    if (!exists) {
      return failure(PanierActionsErrorEnum.PANIER_NOT_FOUND);
    }
    await this.actionsRepository.setStatus(input, tx);
    return success(undefined);
  }

  async clearStatus(
    input: PanierActionInput,
    tx?: Transaction
  ): Promise<Result<void, PanierActionsError>> {
    const exists = await this.panierRepository.exists(input.panierId, tx);
    if (!exists) {
      return failure(PanierActionsErrorEnum.PANIER_NOT_FOUND);
    }
    await this.actionsRepository.clearStatus(input, tx);
    return success(undefined);
  }
}
