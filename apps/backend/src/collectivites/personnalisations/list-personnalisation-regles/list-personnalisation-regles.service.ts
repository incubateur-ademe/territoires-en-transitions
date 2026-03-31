import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { PersonnalisationRegle } from '@tet/domain/collectivites';
import { inArray } from 'drizzle-orm';
import { personnalisationRegleTable } from '../models/personnalisation-regle.table';
import type { ListPersonnalisationReglesInput } from './list-personnalisation-regles.input';

@Injectable()
export class ListPersonnalisationReglesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async listRegles(
    input: ListPersonnalisationReglesInput,
    tx?: Transaction
  ): Promise<PersonnalisationRegle[]> {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<PersonnalisationRegle[]> => {
      const query = transaction
        .select({
          actionId: personnalisationRegleTable.actionId,
          type: personnalisationRegleTable.type,
          formule: personnalisationRegleTable.formule,
          description: personnalisationRegleTable.description,
          modifiedAt: personnalisationRegleTable.modifiedAt,
        })
        .from(personnalisationRegleTable)
        .orderBy(personnalisationRegleTable.actionId)
        .where(
          input?.actionIds?.length
            ? inArray(personnalisationRegleTable.actionId, input.actionIds)
            : undefined
        );

      return query;
    };

    return tx
      ? executeInTransaction(tx)
      : this.databaseService.db.transaction(async (newTx) =>
          executeInTransaction(newTx)
        );
  }
}
