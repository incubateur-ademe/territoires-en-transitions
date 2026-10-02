import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { IndicateurVueFilters } from '@tet/domain/indicateurs';
import { and, asc, eq, sql } from 'drizzle-orm';
import { indicateurVueTable } from './indicateur-vue.table';
import {
  CreateIndicateurVueInput,
  DeleteIndicateurVueInput,
} from './indicateur-vues.input';

@Injectable()
export class IndicateurVuesRepository {
  constructor(private readonly database: DatabaseService) {}

  list(collectiviteId: number, tx?: Transaction) {
    return (tx ?? this.database.db)
      .select()
      .from(indicateurVueTable)
      .where(eq(indicateurVueTable.collectiviteId, collectiviteId))
      .orderBy(asc(indicateurVueTable.createdAt), asc(indicateurVueTable.id));
  }

  async getById(id: string, tx?: Transaction) {
    const [vue] = await (tx ?? this.database.db)
      .select()
      .from(indicateurVueTable)
      .where(eq(indicateurVueTable.id, id));
    return vue;
  }

  async create(
    input: CreateIndicateurVueInput,
    userId: string,
    tx?: Transaction
  ) {
    const [vue] = await (tx ?? this.database.db)
      .insert(indicateurVueTable)
      .values({ ...input, createdBy: userId, modifiedBy: userId })
      .returning();
    return vue;
  }

  async update(
    { id, collectiviteId }: DeleteIndicateurVueInput,
    changes: { nom?: string; filtres?: IndicateurVueFilters },
    userId: string,
    tx?: Transaction
  ) {
    const [vue] = await (tx ?? this.database.db)
      .update(indicateurVueTable)
      .set({ ...changes, modifiedBy: userId, modifiedAt: sql`now()` })
      .where(
        and(
          eq(indicateurVueTable.id, id),
          eq(indicateurVueTable.collectiviteId, collectiviteId)
        )
      )
      .returning();
    return vue;
  }

  async delete(
    { id, collectiviteId }: DeleteIndicateurVueInput,
    tx?: Transaction
  ) {
    const [vue] = await (tx ?? this.database.db)
      .delete(indicateurVueTable)
      .where(
        and(
          eq(indicateurVueTable.id, id),
          eq(indicateurVueTable.collectiviteId, collectiviteId)
        )
      )
      .returning({ id: indicateurVueTable.id });
    return vue;
  }
}
