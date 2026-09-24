import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { BibliothequeFichier } from '@tet/domain/collectivites';
import { and, eq } from 'drizzle-orm';
import { bibliothequeFichierTable } from './models/bibliotheque-fichier.table';

@Injectable()
export class BibliothequeFichierRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByHash(
    {
      collectiviteId,
      hash,
    }: Pick<BibliothequeFichier, 'collectiviteId' | 'hash'>,
    tx?: Transaction
  ): Promise<BibliothequeFichier | undefined> {
    const [fichier] = await (tx ?? this.databaseService.db)
      .select()
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

  async isFichierOwnedByCollectivite(
    {
      fichierId,
      collectiviteId,
    }: Pick<BibliothequeFichier, 'collectiviteId'> & {
      fichierId: BibliothequeFichier['id'];
    },
    tx?: Transaction
  ): Promise<boolean> {
    const [fichier] = await (tx ?? this.databaseService.db)
      .select({ id: bibliothequeFichierTable.id })
      .from(bibliothequeFichierTable)
      .where(
        and(
          eq(bibliothequeFichierTable.id, fichierId),
          eq(bibliothequeFichierTable.collectiviteId, collectiviteId)
        )
      )
      .limit(1);

    return fichier !== undefined;
  }
}
