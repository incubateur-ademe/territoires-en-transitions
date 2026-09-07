import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { and, eq } from 'drizzle-orm';
import { bibliothequeFichierTable } from '../models/bibliotheque-fichier.table';

@Injectable()
export class CreateUploadTokenRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findFichierIdByHash({
    collectiviteId,
    hash,
  }: {
    collectiviteId: number;
    hash: string;
  }): Promise<number | undefined> {
    const [fichier] = await this.databaseService.db
      .select({ id: bibliothequeFichierTable.id })
      .from(bibliothequeFichierTable)
      .where(
        and(
          eq(bibliothequeFichierTable.collectiviteId, collectiviteId),
          eq(bibliothequeFichierTable.hash, hash)
        )
      )
      .limit(1);

    return fichier?.id;
  }
}
