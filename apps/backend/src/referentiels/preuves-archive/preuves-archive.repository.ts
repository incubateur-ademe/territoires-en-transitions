import { Injectable, Logger } from '@nestjs/common';
import { auditeurTable } from '@tet/backend/referentiels/labellisations/auditeur.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { and, asc, eq, gt, inArray } from 'drizzle-orm';
import {
  AuditPreuvesArchive,
  auditPreuvesArchiveStatusSchema,
  AuditPreuvesArchiveStatus,
  AuditPreuvesArchiveStatusEnum,
  auditPreuvesArchiveTable,
} from './models/audit-preuves-archive.table';
import {
  PreuvesArchiveErrorEnum,
  type PreuvesArchiveError,
} from './preuves-archive.errors';

export interface CreateArchiveInput {
  collectiviteId: number;
  referentielId: string;
  auditId: number;
  requestedBy: string;
  expiresAt: string;
}

export interface UpdateArchiveProgressInput {
  processedFiles: number;
  totalFiles?: number;
}

@Injectable()
export class PreuvesArchiveRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(PreuvesArchiveRepository.name);

  constructor(private readonly database: DatabaseService) {}

  async createOrGetInFlight(
    input: CreateArchiveInput
  ): Promise<Result<AuditPreuvesArchive, PreuvesArchiveError>> {
    try {
      const [created] = await this.db
        .insert(auditPreuvesArchiveTable)
        .values({
          collectiviteId: input.collectiviteId,
          referentielId: input.referentielId,
          auditId: input.auditId,
          requestedBy: input.requestedBy,
          status: AuditPreuvesArchiveStatusEnum.PENDING,
          expiresAt: input.expiresAt,
        })
        .onConflictDoNothing()
        .returning();

      if (created) {
        return this.parseRow(created);
      }

      const [existing] = await this.db
        .select()
        .from(auditPreuvesArchiveTable)
        .where(
          and(
            eq(auditPreuvesArchiveTable.auditId, input.auditId),
            eq(auditPreuvesArchiveTable.requestedBy, input.requestedBy)
          )
        )
        .limit(1);

      if (!existing) {
        return failure(
          PreuvesArchiveErrorEnum.CREATE_ARCHIVE_ERROR,
          new Error(
            'Aucune ligne créée ni job in-flight trouvé après ON CONFLICT'
          )
        );
      }

      return this.parseRow(existing);
    } catch (error) {
      this.logger.error(`Création du job d'archive: ${getErrorMessage(error)}`);
      return failure(
        PreuvesArchiveErrorEnum.CREATE_ARCHIVE_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async getByIdRaw(
    id: string
  ): Promise<Result<AuditPreuvesArchive, PreuvesArchiveError>> {
    try {
      const [row] = await this.db
        .select()
        .from(auditPreuvesArchiveTable)
        .where(eq(auditPreuvesArchiveTable.id, id))
        .limit(1);

      if (!row) {
        return failure(
          PreuvesArchiveErrorEnum.ARCHIVE_NOT_FOUND,
          new Error(`Archive ${id} non trouvée`)
        );
      }

      return this.parseRow(row);
    } catch (error) {
      this.logger.error(
        `Lecture du job d'archive ${id}: ${getErrorMessage(error)}`
      );
      return failure(
        PreuvesArchiveErrorEnum.GET_ARCHIVE_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async getByIdForUser(input: {
    id: string;
    requestedBy: string;
  }): Promise<Result<AuditPreuvesArchive, PreuvesArchiveError>> {
    try {
      const [row] = await this.db
        .select()
        .from(auditPreuvesArchiveTable)
        .where(
          and(
            eq(auditPreuvesArchiveTable.id, input.id),
            eq(auditPreuvesArchiveTable.requestedBy, input.requestedBy)
          )
        )
        .limit(1);

      if (!row) {
        return failure(
          PreuvesArchiveErrorEnum.ARCHIVE_NOT_FOUND,
          new Error(`Archive ${input.id} non trouvée`)
        );
      }

      return this.parseRow(row);
    } catch (error) {
      this.logger.error(
        `Lecture du job d'archive ${input.id}: ${getErrorMessage(error)}`
      );
      return failure(
        PreuvesArchiveErrorEnum.GET_ARCHIVE_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async list(input: {
    collectiviteId: number;
    referentielId: string;
    requestedBy: string;
  }): Promise<Result<AuditPreuvesArchive[], PreuvesArchiveError>> {
    try {
      const rows = await this.db
        .select()
        .from(auditPreuvesArchiveTable)
        .where(
          and(
            eq(auditPreuvesArchiveTable.collectiviteId, input.collectiviteId),
            eq(auditPreuvesArchiveTable.referentielId, input.referentielId),
            eq(auditPreuvesArchiveTable.requestedBy, input.requestedBy),
            gt(auditPreuvesArchiveTable.expiresAt, new Date().toISOString())
          )
        )
        .orderBy(asc(auditPreuvesArchiveTable.createdAt));

      const parsed = rows.map((row) => this.parseRow(row));
      const failed = parsed.find((result) => !result.success);
      if (failed && !failed.success) {
        return failed;
      }
      return success(
        parsed.flatMap((result) => (result.success ? [result.data] : []))
      );
    } catch (error) {
      this.logger.error(
        `Liste des archives (collectivité ${input.collectiviteId}, référentiel ${input.referentielId}, user ${input.requestedBy}): ${getErrorMessage(
          error
        )}`
      );
      return failure(
        PreuvesArchiveErrorEnum.GET_ARCHIVE_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async getAuditeurMembership(input: {
    auditId: number;
    userId: string;
  }): Promise<Result<boolean, PreuvesArchiveError>> {
    try {
      const [row] = await this.db
        .select({ auditId: auditeurTable.auditId })
        .from(auditeurTable)
        .where(
          and(
            eq(auditeurTable.auditId, input.auditId),
            eq(auditeurTable.auditeur, input.userId)
          )
        )
        .limit(1);

      return success(row !== undefined);
    } catch (error) {
      this.logger.error(
        `Lecture du rôle auditeur (user ${input.userId}, audit ${input.auditId}): ${getErrorMessage(
          error
        )}`
      );
      return failure(
        PreuvesArchiveErrorEnum.GET_ARCHIVE_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  /**
   * Compense l'enfilement BullMQ qui a échoué après `createOrGetInFlight` :
   * supprime la ligne `pending` sinon elle bloque l'index unique partiel
   * jusqu'à expiration TTL.
   */
  async deleteIfPending(id: string): Promise<Result<undefined, PreuvesArchiveError>> {
    try {
      await this.db
        .delete(auditPreuvesArchiveTable)
        .where(
          and(
            eq(auditPreuvesArchiveTable.id, id),
            eq(auditPreuvesArchiveTable.status, AuditPreuvesArchiveStatusEnum.PENDING)
          )
        );
      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Suppression de la ligne pending ${id}: ${getErrorMessage(error)}`
      );
      return failure(
        PreuvesArchiveErrorEnum.UPDATE_ARCHIVE_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async transitionToProcessing(
    id: string
  ): Promise<Result<AuditPreuvesArchive, PreuvesArchiveError>> {
    return this.updateAndReturn(
      id,
      {
        status: AuditPreuvesArchiveStatusEnum.PROCESSING,
        errorMessage: null,
        storagePath: null,
        processedFiles: 0,
        totalFiles: 0,
        modifiedAt: new Date().toISOString(),
      },
      [
        AuditPreuvesArchiveStatusEnum.PENDING,
        AuditPreuvesArchiveStatusEnum.PROCESSING,
        AuditPreuvesArchiveStatusEnum.FAILED,
      ]
    );
  }

  async markCompleted(
    id: string,
    storagePath: string
  ): Promise<Result<AuditPreuvesArchive, PreuvesArchiveError>> {
    return this.updateAndReturn(
      id,
      {
        status: AuditPreuvesArchiveStatusEnum.COMPLETED,
        storagePath,
        modifiedAt: new Date().toISOString(),
      },
      [AuditPreuvesArchiveStatusEnum.PROCESSING]
    );
  }

  async markFailed(
    id: string,
    errorMessage: string
  ): Promise<Result<AuditPreuvesArchive, PreuvesArchiveError>> {
    return this.updateAndReturn(
      id,
      {
        status: AuditPreuvesArchiveStatusEnum.FAILED,
        errorMessage,
        modifiedAt: new Date().toISOString(),
      },
      [AuditPreuvesArchiveStatusEnum.PROCESSING]
    );
  }

  private async updateAndReturn(
    id: string,
    patch: Partial<typeof auditPreuvesArchiveTable.$inferInsert>,
    allowedFromStatuses?: AuditPreuvesArchiveStatus[]
  ): Promise<Result<AuditPreuvesArchive, PreuvesArchiveError>> {
    try {
      const whereClause = allowedFromStatuses
        ? and(
            eq(auditPreuvesArchiveTable.id, id),
            inArray(auditPreuvesArchiveTable.status, allowedFromStatuses)
          )
        : eq(auditPreuvesArchiveTable.id, id);

      const [row] = await this.db
        .update(auditPreuvesArchiveTable)
        .set(patch)
        .where(whereClause)
        .returning();

      if (!row) {
        return failure(
          PreuvesArchiveErrorEnum.ARCHIVE_NOT_FOUND,
          new Error(`Archive ${id} non trouvée`)
        );
      }

      return this.parseRow(row);
    } catch (error) {
      this.logger.error(
        `Mise à jour du job ${id}: ${getErrorMessage(error)}`
      );
      return failure(
        PreuvesArchiveErrorEnum.UPDATE_ARCHIVE_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async updateProgress(
    id: string,
    input: UpdateArchiveProgressInput
  ): Promise<Result<AuditPreuvesArchive, PreuvesArchiveError>> {
    return this.updateAndReturn(
      id,
      {
        processedFiles: input.processedFiles,
        totalFiles: input.totalFiles,
        modifiedAt: new Date().toISOString(),
      },
      [AuditPreuvesArchiveStatusEnum.PROCESSING]
    );
  }

  // La colonne `status` est `text` en base alors que le schéma Drizzle annonce
  // `AuditPreuvesArchiveStatus` : on valide au runtime pour rattraper une valeur
  // divergente (migration manuelle, donnée héritée) au lieu de la caster aveuglément.
  private parseRow(
    row: AuditPreuvesArchive
  ): Result<AuditPreuvesArchive, PreuvesArchiveError> {
    const parsedStatus = auditPreuvesArchiveStatusSchema.safeParse(row.status);
    if (!parsedStatus.success) {
      return failure(
        PreuvesArchiveErrorEnum.ARCHIVE_STATUS_PARSE_ERROR,
        parsedStatus.error
      );
    }
    return success({ ...row, status: parsedStatus.data });
  }
}
