import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { and, eq } from 'drizzle-orm';
import { bibliothequeFichierTable } from '../models/bibliotheque-fichier.table';

export type DocumentToDownload = Pick<
  typeof bibliothequeFichierTable.$inferSelect,
  'hash' | 'filename' | 'confidentiel'
>;

@Injectable()
export class GetDownloadUrlRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findDocument({
    collectiviteId,
    fichierId,
  }: {
    collectiviteId: number;
    fichierId: number;
  }): Promise<DocumentToDownload | undefined> {
    const [document] = await this.databaseService.db
      .select({
        hash: bibliothequeFichierTable.hash,
        filename: bibliothequeFichierTable.filename,
        confidentiel: bibliothequeFichierTable.confidentiel,
      })
      .from(bibliothequeFichierTable)
      .where(
        and(
          eq(bibliothequeFichierTable.collectiviteId, collectiviteId),
          eq(bibliothequeFichierTable.id, fichierId)
        )
      )
      .limit(1);

    return document;
  }
}
