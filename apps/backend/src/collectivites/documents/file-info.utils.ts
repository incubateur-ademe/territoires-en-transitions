import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { StoredFile } from '@tet/domain/collectivites';
import { and, eq, sql, type DriverValueDecoder, type SQL } from 'drizzle-orm';
import { collectiviteBucketTable } from '../shared/models/collectivite-bucket.table';
import { bibliothequeFichierTable } from './models/bibliotheque-fichier.table';
import { storageObjectTable } from './models/storage-object.table';

export type FichierSubquery = ReturnType<typeof buildFichierSubquery>;

const filesizeDecoder: DriverValueDecoder<number | null, string> = {
  mapFromDriverValue: Number,
};

export function buildFilesizeSql(): SQL<number | null> {
  return sql`(${storageObjectTable.metadata}->>'size')::bigint`.mapWith(
    filesizeDecoder
  );
}

export function buildFichierSubquery(db: DatabaseService['db'] | Transaction) {
  return db
    .select({
      id: bibliothequeFichierTable.id,
      collectiviteId: bibliothequeFichierTable.collectiviteId,
      hash: bibliothequeFichierTable.hash,
      filename: bibliothequeFichierTable.filename,
      confidentiel: bibliothequeFichierTable.confidentiel,
      bucketId: collectiviteBucketTable.bucketId,
      filesize: buildFilesizeSql().as('filesize'),
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
      storageObjectTable,
      and(
        eq(storageObjectTable.bucketId, collectiviteBucketTable.bucketId),
        eq(storageObjectTable.name, bibliothequeFichierTable.hash)
      )
    )
    .as('fichier');
}

export function buildFileInfoSql(fichier: FichierSubquery) {
  return sql<StoredFile | null>`
      CASE WHEN ${fichier.id} IS NULL THEN NULL
      ELSE json_build_object(
        'id', ${fichier.id},
        'collectiviteId', ${fichier.collectiviteId},
        'hash', ${fichier.hash},
        'filename', ${fichier.filename},
        'confidentiel', ${fichier.confidentiel},
        'bucketId', ${fichier.bucketId},
        'filesize', ${fichier.filesize}
      )
      END
    `;
}
