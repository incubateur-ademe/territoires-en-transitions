import { Injectable } from '@nestjs/common';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  BibliothequeFichier,
  StoredDocumentHash,
} from '@tet/domain/collectivites';
import { and, eq } from 'drizzle-orm';
import { storageObjectTable } from './models/storage-object.table';

@Injectable()
export class StorageObjectRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async existsInBucket(
    { bucketId, hash }: { bucketId: string; hash: StoredDocumentHash },
    tx?: Transaction
  ): Promise<boolean> {
    const [storageObject] = await (tx ?? this.databaseService.db)
      .select({ id: storageObjectTable.id })
      .from(storageObjectTable)
      .where(
        and(
          eq(storageObjectTable.bucketId, bucketId),
          eq(storageObjectTable.name, hash)
        )
      )
      .limit(1);

    return storageObject !== undefined;
  }

  async existsForCollectivite(
    {
      collectiviteId,
      hash,
    }: Pick<BibliothequeFichier, 'collectiviteId' | 'hash'>,
    tx?: Transaction
  ): Promise<boolean> {
    const [storageObject] = await (tx ?? this.databaseService.db)
      .select({ id: storageObjectTable.id })
      .from(storageObjectTable)
      .innerJoin(
        collectiviteBucketTable,
        eq(collectiviteBucketTable.bucketId, storageObjectTable.bucketId)
      )
      .where(
        and(
          eq(collectiviteBucketTable.collectiviteId, collectiviteId),
          eq(storageObjectTable.name, hash)
        )
      )
      .limit(1);

    return storageObject !== undefined;
  }
}
