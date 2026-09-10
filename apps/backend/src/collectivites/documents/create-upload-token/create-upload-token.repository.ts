import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { BibliothequeFichier, DocumentHash } from '@tet/domain/collectivites';
import { and, eq } from 'drizzle-orm';
import { bibliothequeFichierTable } from '../models/bibliotheque-fichier.table';

export type FichierInBibliotheque = Pick<
  BibliothequeFichier,
  'id' | 'filename'
>;

@Injectable()
export class CreateUploadTokenRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findFichierByHash({
    collectiviteId,
    hash,
  }: {
    collectiviteId: number;
    hash: DocumentHash;
  }): Promise<FichierInBibliotheque | undefined> {
    const [fichier] = await this.databaseService.db
      .select({
        id: bibliothequeFichierTable.id,
        filename: bibliothequeFichierTable.filename,
      })
      .from(bibliothequeFichierTable)
      .where(
        and(
          eq(bibliothequeFichierTable.collectiviteId, collectiviteId),
          eq(bibliothequeFichierTable.hash, hash)
        )
      )
      .limit(1);

    return fichier;
  }
}
