import { Injectable, Logger } from '@nestjs/common';
import {
  buildFichierSubquery,
  buildFileInfoSql,
} from '@tet/backend/collectivites/documents/file-info.utils';
import { hideConfidentielFilter } from '@tet/backend/collectivites/documents/hide-confidentiel.utils';
import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import { createdByNom, dcpTable } from '@tet/backend/users/models/dcp.table';
import { sqlToDate, sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, getTableColumns, sql } from 'drizzle-orm';
import { auditTable } from '../../labellisations/audit.table';
import { labellisationDemandeTable } from '../../labellisations/labellisation-demande.table';
import { ListDocumentsAuditErrorEnum } from './list-documents-audit.errors';

type AuditScope = {
  collectiviteId: number;
  auditId: number;
  canReadConfidentiel: boolean;
};

@Injectable()
export class ListDocumentsAuditRepository {
  private readonly logger = new Logger(ListDocumentsAuditRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listDocumentsAudit({
    collectiviteId,
    auditId,
    canReadConfidentiel,
  }: AuditScope) {
    const db = this.databaseService.db;
    const fichier = buildFichierSubquery(db);

    try {
      const preuves = await db
        .select({
          ...getTableColumns(preuveAuditTable),
          modifiedAt: sqlToDateTimeISO(preuveAuditTable.modifiedAt),
          fichier: buildFileInfoSql(fichier),
          demande: {
            ...getTableColumns(labellisationDemandeTable),
            date: sqlToDate(labellisationDemandeTable.date),
            modifiedAt: sqlToDateTimeISO(labellisationDemandeTable.modifiedAt),
            envoyeeLe: sqlToDateTimeISO(labellisationDemandeTable.envoyeeLe),
          },
          audit: {
            ...getTableColumns(auditTable),
            dateDebut: sqlToDateTimeISO(auditTable.dateDebut),
            dateFin: sqlToDateTimeISO(auditTable.dateFin),
            dateCnl: sqlToDateTimeISO(auditTable.dateCnl),
          },
          modifiedByNom: createdByNom,
          preuveType: sql<'audit'>`'audit'`,
        })
        .from(preuveAuditTable)
        .leftJoin(
          fichier,
          and(
            eq(preuveAuditTable.fichierId, fichier.id),
            eq(fichier.collectiviteId, collectiviteId)
          )
        )
        .innerJoin(auditTable, eq(preuveAuditTable.auditId, auditTable.id))
        .leftJoin(
          labellisationDemandeTable,
          eq(auditTable.demandeId, labellisationDemandeTable.id)
        )
        .leftJoin(dcpTable, eq(preuveAuditTable.modifiedBy, dcpTable.id))
        .where(
          and(
            eq(preuveAuditTable.auditId, auditId),
            eq(preuveAuditTable.collectiviteId, collectiviteId),
            hideConfidentielFilter({
              fichierIdColumn: preuveAuditTable.fichierId,
              confidentielColumn: fichier.confidentiel,
              canReadConfidentiel,
            })
          )
        )
        .orderBy(preuveAuditTable.id);

      return success(preuves);
    } catch (error) {
      this.logger.error(
        `Echec de la lecture des documents de l'audit ${auditId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(ListDocumentsAuditErrorEnum.DATABASE_ERROR);
    }
  }
}
