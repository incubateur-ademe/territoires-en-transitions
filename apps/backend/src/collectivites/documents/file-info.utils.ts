import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { BibliothequeFichier } from '@tet/domain/collectivites';
import { and, eq, sql } from 'drizzle-orm';
import { collectiviteBucketTable } from '../shared/models/collectivite-bucket.table';
import { bibliothequeFichierTable } from './models/bibliotheque-fichier.table';
import { storageObjectTable } from './models/storage-object.table';

export type FichierSubquery = ReturnType<typeof buildFichierSubquery>;

export function buildFichierSubquery(db: DatabaseService['db'] | Transaction) {
  return db
    .select({
      id: bibliothequeFichierTable.id,
      collectiviteId: bibliothequeFichierTable.collectiviteId,
      hash: bibliothequeFichierTable.hash,
      filename: bibliothequeFichierTable.filename,
      confidentiel: bibliothequeFichierTable.confidentiel,
      bucketId: collectiviteBucketTable.bucketId,
      filesize: sql<
        number | null
      >`(${storageObjectTable.metadata}->>'size')::integer`.as('filesize'),
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
  return sql<
    | (BibliothequeFichier & {
        bucketId: string;
        filesize: number | null;
      })
    | null
  >`
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
