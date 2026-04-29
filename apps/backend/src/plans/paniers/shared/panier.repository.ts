import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { eq } from 'drizzle-orm';
import { panierTable } from '../models/panier.table';

@Injectable()
export class PanierRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async exists(panierId: string, tx?: Transaction): Promise<boolean> {
    const db = tx ?? this.databaseService.db;
    const [row] = await db
      .select({ id: panierTable.id })
      .from(panierTable)
      .where(eq(panierTable.id, panierId))
      .limit(1);
    return row !== undefined;
  }
}
