import { Injectable } from '@nestjs/common';
import { buildConflictUpdateColumns } from '@tet/backend/utils/database/conflict.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  IndicateurValeur,
  IndicateurValeurWithoutReferenceType,
} from '@tet/domain/indicateurs';
import { isNull } from 'drizzle-orm';
import { indicateurValeurTable } from './indicateur-valeur.table';

export type BatchValeurFieldRow = {
  collectiviteId: number;
  indicateurId: number;
  dateValeur: string;
  valeur: number;
  createdBy: string | null;
  createdAt: string;
  modifiedBy: string | null;
  modifiedAt: string;
};

@Injectable()
export class BatchUpsertValeursFieldRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async upsertMany(
    rows: BatchValeurFieldRow[],
    field: IndicateurValeurWithoutReferenceType,
    tx?: Transaction
  ): Promise<IndicateurValeur[]> {
    return (tx ?? this.databaseService.db)
      .insert(indicateurValeurTable)
      .values(
        rows.map((row) => ({
          collectiviteId: row.collectiviteId,
          indicateurId: row.indicateurId,
          dateValeur: row.dateValeur,
          [field]: row.valeur,
          createdBy: row.createdBy,
          createdAt: row.createdAt,
          modifiedBy: row.modifiedBy,
          modifiedAt: row.modifiedAt,
          metadonneeId: null,
        }))
      )
      .onConflictDoUpdate({
        target: [
          indicateurValeurTable.indicateurId,
          indicateurValeurTable.collectiviteId,
          indicateurValeurTable.dateValeur,
        ],
        targetWhere: isNull(indicateurValeurTable.metadonneeId),
        set: buildConflictUpdateColumns(indicateurValeurTable, [
          field,
          'modifiedBy',
          'modifiedAt',
        ]),
      })
      .returning();
  }
}
