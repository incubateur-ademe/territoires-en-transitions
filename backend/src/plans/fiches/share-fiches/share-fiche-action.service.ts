import { DatabaseService } from '@/backend/utils';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  FicheActionSharing,
  FicheActionSharingInsert,
  ficheActionSharingTable,
} from './fiche-action-sharing.table';

@Injectable()
export class ShareFicheActionService {
  private readonly logger = new Logger(ShareFicheActionService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getFicheActionSharing(ficheId: number): Promise<FicheActionSharing[]> {
    return this.databaseService.db
      .select()
      .from(ficheActionSharingTable)
      .where(eq(ficheActionSharingTable.ficheId, ficheId));
  }

  async shareFicheAction(
    ficheId: number,
    withCollectiviteIds: number[],
    tx?: Transaction
  ): Promise<FicheActionSharing[]> {
    this.logger.log(`Deleting existing sharing for fiche ${ficheId}`);

    await (tx ?? this.databaseService.db)
      .delete(ficheActionSharingTable)
      .where(eq(ficheActionSharingTable.ficheId, ficheId));

    if (withCollectiviteIds.length === 0) {
      this.logger.log(`No sharing to be saved for fiche ${ficheId}`);
      return [];
    }

    this.logger.log(
      `Sharing fiche ${ficheId} with collectivite ids ${withCollectiviteIds.join(
        ', '
      )}`
    );

    const newSharings: FicheActionSharingInsert[] = withCollectiviteIds.map(
      (collectiviteId) => ({
        ficheId,
        collectiviteId,
      })
    );

    const sharings = await (tx ?? this.databaseService.db)
      .insert(ficheActionSharingTable)
      .values(newSharings)
      .returning();

    return sharings;
  }
}
