import { Injectable } from '@nestjs/common';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { eq } from 'drizzle-orm';

@Injectable()
export class CollectiviteBucketRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findBucketId(
    collectiviteId: number,
    tx?: Transaction
  ): Promise<string | undefined> {
    const [bucket] = await (tx ?? this.databaseService.db)
      .select({ bucketId: collectiviteBucketTable.bucketId })
      .from(collectiviteBucketTable)
      .where(eq(collectiviteBucketTable.collectiviteId, collectiviteId))
      .orderBy(collectiviteBucketTable.bucketId)
      .limit(1);

    return bucket?.bucketId;
  }
}
