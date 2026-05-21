import { Injectable, Logger } from '@nestjs/common';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { preuveActionTable } from '@tet/backend/collectivites/documents/models/preuve-action.table';
import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import { preuveComplementaireTable } from '@tet/backend/collectivites/documents/models/preuve-complementaire.table';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { preuveReglementaireTable } from '@tet/backend/collectivites/documents/models/preuve-reglementaire.table';
import { storageObjectTable } from '@tet/backend/collectivites/documents/models/storage-object.table';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, inArray, isNull, or, sql, type Column, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import {
  PreuvesArchiveErrorEnum,
  type PreuvesArchiveError,
} from '../preuves-archive.errors';

const storageMetadataSchema = z.object({
  size: z.union([z.number(), z.string()]),
});

export interface CollectedFilePreuve {
  bucketId: string | null;
  hash: string;
  filename: string | null;
  filesize: number | null;
  actionId: string | null;
}

export interface CollectedLinkPreuve {
  url: string;
  titre: string | null;
  commentaire: string | null;
  actionId: string | null;
}

type CollectedPreuves = {
  files: CollectedFilePreuve[];
  links: CollectedLinkPreuve[];
};

@Injectable()
export class CollectPreuvesRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(CollectPreuvesRepository.name);

  constructor(private readonly database: DatabaseService) {}

  async getComplementairePreuves(input: {
    collectiviteId: number;
    canReadConfidentiel: boolean;
  }): Promise<Result<CollectedPreuves, PreuvesArchiveError>> {
    const { collectiviteId, canReadConfidentiel } = input;
    try {
      const rows = await this.db
        .select({
          actionId: preuveComplementaireTable.actionId,
          fichierId: preuveComplementaireTable.fichierId,
          url: preuveComplementaireTable.url,
          titre: preuveComplementaireTable.titre,
          commentaire: preuveComplementaireTable.commentaire,
          bucketId: storageObjectTable.bucketId,
          hash: bibliothequeFichierTable.hash,
          filename: bibliothequeFichierTable.filename,
          metadata: storageObjectTable.metadata,
        })
        .from(preuveComplementaireTable)
        .leftJoin(
          bibliothequeFichierTable,
          and(
            eq(preuveComplementaireTable.fichierId, bibliothequeFichierTable.id),
            eq(bibliothequeFichierTable.collectiviteId, collectiviteId)
          )
        )
        .leftJoin(
          storageObjectTable,
          and(
            eq(storageObjectTable.name, bibliothequeFichierTable.hash),
            this.storageObjectInCollectiviteBuckets(collectiviteId)
          )
        )
        .where(
          and(
            eq(preuveComplementaireTable.collectiviteId, collectiviteId),
            this.hideConfidentielFilter(
              preuveComplementaireTable.fichierId,
              canReadConfidentiel
            )
          )
        );

      return success(this.splitFilesAndLinks(rows));
    } catch (error) {
      this.logger.error(
        `Collecte des preuves complémentaires: ${getErrorMessage(error)}`
      );
      return failure(
        PreuvesArchiveErrorEnum.COLLECT_PREUVES_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async getReglementairePreuves(input: {
    collectiviteId: number;
    canReadConfidentiel: boolean;
  }): Promise<Result<CollectedPreuves, PreuvesArchiveError>> {
    const { collectiviteId, canReadConfidentiel } = input;
    try {
      const rows = await this.db
        .select({
          actionId: preuveActionTable.actionId,
          fichierId: preuveReglementaireTable.fichierId,
          url: preuveReglementaireTable.url,
          titre: preuveReglementaireTable.titre,
          commentaire: preuveReglementaireTable.commentaire,
          bucketId: storageObjectTable.bucketId,
          hash: bibliothequeFichierTable.hash,
          filename: bibliothequeFichierTable.filename,
          metadata: storageObjectTable.metadata,
        })
        .from(preuveReglementaireTable)
        .innerJoin(
          preuveActionTable,
          eq(preuveReglementaireTable.preuveId, preuveActionTable.preuveId)
        )
        .leftJoin(
          bibliothequeFichierTable,
          and(
            eq(preuveReglementaireTable.fichierId, bibliothequeFichierTable.id),
            eq(bibliothequeFichierTable.collectiviteId, collectiviteId)
          )
        )
        .leftJoin(
          storageObjectTable,
          and(
            eq(storageObjectTable.name, bibliothequeFichierTable.hash),
            this.storageObjectInCollectiviteBuckets(collectiviteId)
          )
        )
        .where(
          and(
            eq(preuveReglementaireTable.collectiviteId, collectiviteId),
            this.hideConfidentielFilter(
              preuveReglementaireTable.fichierId,
              canReadConfidentiel
            )
          )
        );

      return success(this.splitFilesAndLinks(rows));
    } catch (error) {
      this.logger.error(
        `Collecte des preuves réglementaires: ${getErrorMessage(error)}`
      );
      return failure(
        PreuvesArchiveErrorEnum.COLLECT_PREUVES_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async getLabellisationPreuves(input: {
    collectiviteId: number;
    demandeId: number;
    canReadConfidentiel: boolean;
  }): Promise<Result<CollectedPreuves, PreuvesArchiveError>> {
    const { collectiviteId, demandeId, canReadConfidentiel } = input;
    try {
      const rows = await this.db
        .select({
          actionId: sql<string | null>`null`,
          fichierId: preuveLabellisationTable.fichierId,
          url: preuveLabellisationTable.url,
          titre: preuveLabellisationTable.titre,
          commentaire: preuveLabellisationTable.commentaire,
          bucketId: storageObjectTable.bucketId,
          hash: bibliothequeFichierTable.hash,
          filename: bibliothequeFichierTable.filename,
          metadata: storageObjectTable.metadata,
        })
        .from(preuveLabellisationTable)
        .leftJoin(
          bibliothequeFichierTable,
          and(
            eq(preuveLabellisationTable.fichierId, bibliothequeFichierTable.id),
            eq(bibliothequeFichierTable.collectiviteId, collectiviteId)
          )
        )
        .leftJoin(
          storageObjectTable,
          and(
            eq(storageObjectTable.name, bibliothequeFichierTable.hash),
            this.storageObjectInCollectiviteBuckets(collectiviteId)
          )
        )
        .where(
          and(
            eq(preuveLabellisationTable.demandeId, demandeId),
            eq(preuveLabellisationTable.collectiviteId, collectiviteId),
            this.hideConfidentielFilter(
              preuveLabellisationTable.fichierId,
              canReadConfidentiel
            )
          )
        );

      return success(this.splitFilesAndLinks(rows));
    } catch (error) {
      this.logger.error(
        `Collecte des preuves de labellisation: ${getErrorMessage(error)}`
      );
      return failure(
        PreuvesArchiveErrorEnum.COLLECT_PREUVES_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async getAuditPreuves(input: {
    collectiviteId: number;
    auditId: number;
    canReadConfidentiel: boolean;
  }): Promise<Result<CollectedPreuves, PreuvesArchiveError>> {
    const { collectiviteId, auditId, canReadConfidentiel } = input;
    try {
      const rows = await this.db
        .select({
          actionId: sql<string | null>`null`,
          fichierId: preuveAuditTable.fichierId,
          url: preuveAuditTable.url,
          titre: preuveAuditTable.titre,
          commentaire: preuveAuditTable.commentaire,
          bucketId: storageObjectTable.bucketId,
          hash: bibliothequeFichierTable.hash,
          filename: bibliothequeFichierTable.filename,
          metadata: storageObjectTable.metadata,
        })
        .from(preuveAuditTable)
        .leftJoin(
          bibliothequeFichierTable,
          and(
            eq(preuveAuditTable.fichierId, bibliothequeFichierTable.id),
            eq(bibliothequeFichierTable.collectiviteId, collectiviteId)
          )
        )
        .leftJoin(
          storageObjectTable,
          and(
            eq(storageObjectTable.name, bibliothequeFichierTable.hash),
            this.storageObjectInCollectiviteBuckets(collectiviteId)
          )
        )
        .where(
          and(
            eq(preuveAuditTable.auditId, auditId),
            eq(preuveAuditTable.collectiviteId, collectiviteId),
            this.hideConfidentielFilter(
              preuveAuditTable.fichierId,
              canReadConfidentiel
            )
          )
        );

      return success(this.splitFilesAndLinks(rows));
    } catch (error) {
      this.logger.error(
        `Collecte des preuves d'audit: ${getErrorMessage(error)}`
      );
      return failure(
        PreuvesArchiveErrorEnum.COLLECT_PREUVES_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  private storageObjectInCollectiviteBuckets(collectiviteId: number): SQL {
    return inArray(
      storageObjectTable.bucketId,
      this.db
        .select({ bucketId: collectiviteBucketTable.bucketId })
        .from(collectiviteBucketTable)
        .where(eq(collectiviteBucketTable.collectiviteId, collectiviteId))
    );
  }

  // `confidentiel === null` traité comme confidentiel (fail-closed) ; les liens
  // (sans fichier) ne portent jamais de confidentialité et restent visibles.
  private hideConfidentielFilter(
    fichierIdColumn: Column,
    canReadConfidentiel: boolean
  ): SQL | undefined {
    if (canReadConfidentiel) {
      return undefined;
    }
    return or(
      isNull(fichierIdColumn),
      eq(bibliothequeFichierTable.confidentiel, false)
    );
  }

  private splitFilesAndLinks(
    rows: Array<{
      actionId: string | null;
      fichierId: number | null;
      url: string | null;
      titre: string | null;
      commentaire: string | null;
      bucketId: string | null;
      hash: string | null;
      filename: string | null;
      metadata: unknown;
    }>
  ): CollectedPreuves {
    const files = rows
      .filter(
        (
          row
        ): row is typeof row & {
          fichierId: number;
          hash: string;
        } => row.fichierId !== null && row.hash !== null
      )
      .map((row) => ({
        bucketId: row.bucketId,
        hash: row.hash,
        filename: row.filename,
        filesize: this.readFilesize(row.metadata),
        actionId: row.actionId,
      }));

    const links = rows
      .filter(
        (row): row is typeof row & { url: string } =>
          row.fichierId === null && row.url !== null && row.url !== ''
      )
      .map((row) => ({
        url: row.url,
        titre: row.titre,
        commentaire: row.commentaire,
        actionId: row.actionId,
      }));

    return { files, links };
  }

  private readFilesize(metadata: unknown): number | null {
    const parsed = storageMetadataSchema.safeParse(metadata);
    if (!parsed.success) {
      return null;
    }
    const size = Number(parsed.data.size);
    return Number.isFinite(size) ? size : null;
  }
}
