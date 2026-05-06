import { Injectable, Logger } from '@nestjs/common';
import { annexeTable } from '@tet/backend/collectivites/documents/models/annexe.table';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { storageObjectTable } from '@tet/backend/collectivites/documents/models/storage-object.table';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { createdByNom, dcpTable } from '@tet/backend/users/models/dcp.table';
import { sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { and, asc, eq, inArray, isNull, or, SQL, sql } from 'drizzle-orm';

export type AnnexeListRow = {
  fichierId: number | null;
  id: number;
  collectiviteId: number;
  ficheId: number;
  commentaire: string | null;
  modifiedAt: string;
  modifiedByNom: string | null;
  lien: { titre: string; url: string } | null;
  filename: string | null;
  confidentiel: boolean | null;
  hash: string | null;
  bucketId: string | null;
  filesize: number | null;
};

@Injectable()
export class FicheAnnexesRepository {
  private readonly logger = new Logger(FicheAnnexesRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async findByFicheIds(
    collectiviteId: number,
    ficheIds: number[],
    canReadConfidentiel: boolean
  ): Promise<AnnexeListRow[]> {
    const conditions: (SQL | undefined)[] = [
      eq(annexeTable.collectiviteId, collectiviteId),
      inArray(annexeTable.ficheId, ficheIds),
    ];

    // exclut les fichiers confidentiels si l'utilisateur n'a pas le droit
    if (!canReadConfidentiel) {
      conditions.push(
        or(
          isNull(bibliothequeFichierTable.confidentiel),
          eq(bibliothequeFichierTable.confidentiel, false)
        )
      );
    }

    return this.databaseService.db
      .select({
        fichierId: annexeTable.fichierId,
        id: annexeTable.id,
        collectiviteId: annexeTable.collectiviteId,
        ficheId: annexeTable.ficheId,
        commentaire: annexeTable.commentaire,
        modifiedAt: sqlToDateTimeISO(annexeTable.modifiedAt),
        modifiedByNom: createdByNom,
        lien: annexeTable.lien,
        filename: bibliothequeFichierTable.filename,
        confidentiel: bibliothequeFichierTable.confidentiel,
        hash: bibliothequeFichierTable.hash,
        bucketId: collectiviteBucketTable.bucketId,
        filesize: sql<
          number | null
        >`(${storageObjectTable.metadata}->>'size')::integer`,
      })
      .from(annexeTable)
      .leftJoin(
        bibliothequeFichierTable,
        eq(annexeTable.fichierId, bibliothequeFichierTable.id)
      )
      .leftJoin(
        collectiviteBucketTable,
        eq(
          collectiviteBucketTable.collectiviteId,
          bibliothequeFichierTable.collectiviteId
        )
      )
      .leftJoin(
        storageObjectTable,
        and(
          eq(storageObjectTable.bucketId, collectiviteBucketTable.bucketId),
          eq(storageObjectTable.name, bibliothequeFichierTable.hash)
        )
      )
      .leftJoin(dcpTable, eq(annexeTable.modifiedBy, dcpTable.id))
      .where(and(...conditions))
      .orderBy(
        asc(sql`${annexeTable.lien}->>'titre'`),
        asc(bibliothequeFichierTable.filename)
      );
  }
}
