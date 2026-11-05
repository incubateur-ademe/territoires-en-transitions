import { Injectable } from '@nestjs/common';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CollectiviteRole } from '@tet/domain/users';
import { and, asc, desc, eq, exists, isNull, lt, or, sql } from 'drizzle-orm';
import { bibliothequeFichierTable } from '../models/bibliotheque-fichier.table';
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

export type InfectedObject = ObjectToScan & { signature: string };

@Injectable()
export class ScanFichiersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private isCollectiviteBucket() {
    return exists(
      this.databaseService.db
        .select({ bucketId: collectiviteBucketTable.bucketId })
        .from(collectiviteBucketTable)
        .where(
          eq(collectiviteBucketTable.bucketId, storageObjectTable.bucketId)
        )
    );
  }

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
          this.isCollectiviteBucket(),
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

  /**
   * Objets jugés infectés et encore présents : ceux de l'audit, consignés
   * sans suppression, et ceux qu'une écriture directe dans le bucket aurait
   * fait réapparaître.
   */
  async listInfectedObjects({
    limit,
  }: {
    limit: number;
  }): Promise<InfectedObject[]> {
    const rows = await this.databaseService.db
      .select({
        bucketId: fichierScanTable.bucketId,
        objectName: fichierScanTable.objectName,
        signature: fichierScanTable.signature,
      })
      .from(fichierScanTable)
      .innerJoin(
        storageObjectTable,
        and(
          eq(storageObjectTable.bucketId, fichierScanTable.bucketId),
          eq(storageObjectTable.name, fichierScanTable.objectName)
        )
      )
      .where(eq(fichierScanTable.status, 'infected'))
      .orderBy(asc(fichierScanTable.scannedAt))
      .limit(limit);

    return rows.map(({ signature, ...object }) => ({
      ...object,
      signature: signature ?? '',
    }));
  }

  async findVerdict({
    bucketId,
    objectName,
  }: ObjectToScan): Promise<
    { status: FichierScanStatus; signature: string | null } | undefined
  > {
    const [verdict] = await this.databaseService.db
      .select({
        status: fichierScanTable.status,
        signature: fichierScanTable.signature,
      })
      .from(fichierScanTable)
      .where(
        and(
          eq(fichierScanTable.bucketId, bucketId),
          eq(fichierScanTable.objectName, objectName)
        )
      )
      .limit(1);
    return verdict;
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

  /**
   * Vrai pour la première suppression seulement : deux analyses concurrentes
   * du même objet, ou sa réapparition, ne notifient pas deux fois.
   */
  async markDeleted({ bucketId, objectName }: ObjectToScan): Promise<boolean> {
    const updated = await this.databaseService.db
      .update(fichierScanTable)
      .set({ deletedAt: sql`now()` })
      .where(
        and(
          eq(fichierScanTable.bucketId, bucketId),
          eq(fichierScanTable.objectName, objectName),
          isNull(fichierScanTable.deletedAt)
        )
      )
      .returning({ id: fichierScanTable.id });
    return updated.length > 0;
  }

  async findBucketId(collectiviteId: number): Promise<string | undefined> {
    const [bucket] = await this.databaseService.db
      .select({ bucketId: collectiviteBucketTable.bucketId })
      .from(collectiviteBucketTable)
      .where(eq(collectiviteBucketTable.collectiviteId, collectiviteId))
      .limit(1);
    return bucket?.bucketId;
  }

  /** Un même contenu est infecté partout, quel que soit le bucket. */
  async isHashInfected(hash: string): Promise<boolean> {
    const [row] = await this.databaseService.db
      .select({ id: fichierScanTable.id })
      .from(fichierScanTable)
      .where(
        and(
          eq(fichierScanTable.objectName, hash),
          eq(fichierScanTable.status, 'infected')
        )
      )
      .limit(1);
    return row !== undefined;
  }

  /** Les fichiers de bibliothèque qui pointent sur l'objet, avec leur collectivité. */
  async listFichiersOfObject({ bucketId, objectName }: ObjectToScan): Promise<
    {
      collectiviteId: number;
      collectiviteNom: string | null;
      filename: string;
    }[]
  > {
    return this.databaseService.db
      .select({
        collectiviteId: bibliothequeFichierTable.collectiviteId,
        collectiviteNom: collectiviteTable.nom,
        filename: bibliothequeFichierTable.filename,
      })
      .from(bibliothequeFichierTable)
      .innerJoin(
        collectiviteBucketTable,
        eq(
          collectiviteBucketTable.collectiviteId,
          bibliothequeFichierTable.collectiviteId
        )
      )
      .innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, bibliothequeFichierTable.collectiviteId)
      )
      .where(
        and(
          eq(collectiviteBucketTable.bucketId, bucketId),
          eq(
            bibliothequeFichierTable.hash,
            // Le nom d'objet est le hash, sans sa marque de type.
            objectName as (typeof bibliothequeFichierTable.$inferSelect)['hash']
          )
        )
      )
      .orderBy(asc(bibliothequeFichierTable.filename));
  }

  async listAdminIds(collectiviteId: number): Promise<string[]> {
    const rows = await this.databaseService.db
      .select({ userId: dcpTable.id })
      .from(utilisateurCollectiviteAccessTable)
      .innerJoin(
        dcpTable,
        eq(dcpTable.id, utilisateurCollectiviteAccessTable.userId)
      )
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectiviteId),
          eq(utilisateurCollectiviteAccessTable.isActive, true),
          eq(utilisateurCollectiviteAccessTable.role, CollectiviteRole.ADMIN),
          eq(dcpTable.deleted, false)
        )
      );
    return rows.map(({ userId }) => userId);
  }
}
