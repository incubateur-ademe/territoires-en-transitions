import { Injectable } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { GetActionRepository } from './get-action.repository';

@Injectable()
export class GetActionService {
  constructor(private readonly repo: GetActionRepository) {}

  async findById(
    actionId: string,
    tx?: Transaction
  ): Promise<{ id: string } | null> {
    return this.repo.findById(actionId, tx);
  }
}
