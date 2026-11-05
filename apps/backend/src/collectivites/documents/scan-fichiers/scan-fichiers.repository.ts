import { Injectable } from '@nestjs/common';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { and, desc, eq, exists, isNull, lt, or, sql } from 'drizzle-orm';
import {
  type FichierScanStatus,
  fichierScanTable,
} from '../models/fichier-scan.table';
import { storageObjectTable } from '../models/storage-object.table';

export type ObjectToScan = {
  bucketId: string;
  objectName: string;
};

export type FichierScanVerdict = ObjectToScan & {
  status: FichierScanStatus;
  signature: string | null;
  engineVersion: string | null;
};

@Injectable()
export class ScanFichiersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Objets des buckets de collectivité sans verdict, ou dont l'analyse a
   * échoué moins de `maxAttempts` fois ; les plus récents d'abord, pour que
   * les nouveaux dépôts ne patientent pas derrière le stock.
   */
  async listObjectsToScan({
    limit,
    maxAttempts,
  }: {
    limit: number;
    maxAttempts: number;
  }): Promise<ObjectToScan[]> {
    const rows = await this.databaseService.db
      .select({
        bucketId: storageObjectTable.bucketId,
        objectName: storageObjectTable.name,
      })
      .from(storageObjectTable)
      .leftJoin(
        fichierScanTable,
        and(
          eq(fichierScanTable.bucketId, storageObjectTable.bucketId),
          eq(fichierScanTable.objectName, storageObjectTable.name)
        )
      )
      .where(
        and(
          exists(
            this.databaseService.db
              .select({ bucketId: collectiviteBucketTable.bucketId })
              .from(collectiviteBucketTable)
              .where(
                eq(
                  collectiviteBucketTable.bucketId,
                  storageObjectTable.bucketId
                )
              )
          ),
          or(
            isNull(fichierScanTable.id),
            and(
              eq(fichierScanTable.status, 'error'),
              lt(fichierScanTable.attempts, maxAttempts)
            )
          )
        )
      )
      .orderBy(desc(storageObjectTable.createdAt))
      .limit(limit);

    return rows.flatMap(({ bucketId, objectName }) =>
      bucketId && objectName ? [{ bucketId, objectName }] : []
    );
  }

  /** Un nouvel échec incrémente `attempts` ; un verdict remplace l'erreur. */
  async upsertVerdict(verdict: FichierScanVerdict): Promise<void> {
    await this.databaseService.db
      .insert(fichierScanTable)
      .values(verdict)
      .onConflictDoUpdate({
        target: [fichierScanTable.bucketId, fichierScanTable.objectName],
        set: {
          status: verdict.status,
          signature: verdict.signature,
          engineVersion: verdict.engineVersion,
          attempts: sql`${fichierScanTable.attempts} + 1`,
          scannedAt: sql`now()`,
        },
      });
  }
}
