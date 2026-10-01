import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { eq } from 'drizzle-orm';
import {
  FicheActionSecteurAttribution,
  ficheActionSecteurAttributionTable,
} from './fiche-action-secteur-attribution.table';

export type FicheSecteursAttributionCreate =
  typeof ficheActionSecteurAttributionTable.$inferInsert;

@Injectable()
export class FicheSecteursAttributionRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByFicheId(
    ficheId: number,
    tx?: Transaction
  ): Promise<FicheActionSecteurAttribution | null> {
    const [row] = await (tx ?? this.databaseService.db)
      .select()
      .from(ficheActionSecteurAttributionTable)
      .where(eq(ficheActionSecteurAttributionTable.ficheId, ficheId));
    return row ?? null;
  }

  /**
   * N'écrit que si la fiche n'a pas encore d'attribution : deux premières
   * lectures simultanées ne se gênent pas, et une saisie manuelle n'est jamais écrasée.
   */
  async createIfAbsent(
    attribution: FicheSecteursAttributionCreate,
    tx?: Transaction
  ): Promise<FicheActionSecteurAttribution | null> {
    const [inserted] = await (tx ?? this.databaseService.db)
      .insert(ficheActionSecteurAttributionTable)
      .values(attribution)
      .onConflictDoNothing({
        target: ficheActionSecteurAttributionTable.ficheId,
      })
      .returning();
    return inserted ?? this.findByFicheId(attribution.ficheId, tx);
  }
}
