import { Injectable, Logger } from '@nestjs/common';
import {
  buildFichierSubquery,
  buildFileInfoSql,
} from '@tet/backend/collectivites/documents/file-info.utils';
import { hideConfidentielFilter } from '@tet/backend/collectivites/documents/hide-confidentiel.utils';
import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { preuveRapportTable } from '@tet/backend/collectivites/documents/models/preuve-rapport.table';
import { createdByNom, dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { and, desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { auditTable } from '../../labellisations/audit.table';
import { labellisationDemandeTable } from '../../labellisations/labellisation-demande.table';
import { ListDocumentsErrorEnum } from './list-documents.errors';
import { ListDocumentsInput } from './list-documents.input';

type DocumentsScope = {
  collectiviteId: number;
  referentielId: ListDocumentsInput['referentielId'];
  canReadConfidentiel: boolean;
};

@Injectable()
export class ListDocumentsRepository {
  private readonly logger = new Logger(ListDocumentsRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listLabellisationDocuments(
    { collectiviteId, referentielId, canReadConfidentiel }: DocumentsScope,
    tx?: Transaction
  ) {
    const db = tx ?? this.databaseService.db;
    const fichier = buildFichierSubquery(db);

    try {
      const documents = await db
        .select({
          ...getTableColumns(preuveLabellisationTable),
          fichier: buildFileInfoSql(fichier),
          demande: {
            ...getTableColumns(labellisationDemandeTable),
          },
          modifiedByNom: createdByNom,
          preuveType: sql<'labellisation'>`'labellisation'`,
        })
        .from(preuveLabellisationTable)
        .innerJoin(
          labellisationDemandeTable,
          and(
            eq(
              preuveLabellisationTable.demandeId,
              labellisationDemandeTable.id
            ),
            eq(labellisationDemandeTable.collectiviteId, collectiviteId),
            eq(labellisationDemandeTable.referentiel, referentielId)
          )
        )
        .leftJoin(
          fichier,
          and(
            eq(preuveLabellisationTable.fichierId, fichier.id),
            eq(fichier.collectiviteId, collectiviteId)
          )
        )
        .leftJoin(
          dcpTable,
          eq(preuveLabellisationTable.modifiedBy, dcpTable.id)
        )
        .where(
          and(
            eq(preuveLabellisationTable.collectiviteId, collectiviteId),
            hideConfidentielFilter({
              fichierIdColumn: preuveLabellisationTable.fichierId,
              confidentielColumn: fichier.confidentiel,
              canReadConfidentiel,
            })
          )
        )
        .orderBy(preuveLabellisationTable.id);

      return success(documents);
    } catch (error) {
      this.logger.error(
        `Echec de la lecture des documents de labellisation du referentiel ${referentielId} de la collectivite ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(ListDocumentsErrorEnum.DATABASE_ERROR);
    }
  }

  async listAuditDocuments(
    { collectiviteId, referentielId, canReadConfidentiel }: DocumentsScope,
    tx?: Transaction
  ) {
    const db = tx ?? this.databaseService.db;
    const fichier = buildFichierSubquery(db);

    try {
      const documents = await db
        .select({
          ...getTableColumns(preuveAuditTable),
          fichier: buildFileInfoSql(fichier),
          demande: {
            ...getTableColumns(labellisationDemandeTable),
          },
          audit: {
            ...getTableColumns(auditTable),
          },
          modifiedByNom: createdByNom,
          preuveType: sql<'audit'>`'audit'`,
        })
        .from(preuveAuditTable)
        .innerJoin(
          auditTable,
          and(
            eq(preuveAuditTable.auditId, auditTable.id),
            eq(auditTable.collectiviteId, collectiviteId),
            eq(auditTable.referentielId, referentielId)
          )
        )
        .leftJoin(
          labellisationDemandeTable,
          eq(auditTable.demandeId, labellisationDemandeTable.id)
        )
        .leftJoin(
          fichier,
          and(
            eq(preuveAuditTable.fichierId, fichier.id),
            eq(fichier.collectiviteId, collectiviteId)
          )
        )
        .leftJoin(dcpTable, eq(preuveAuditTable.modifiedBy, dcpTable.id))
        .where(
          and(
            eq(preuveAuditTable.collectiviteId, collectiviteId),
            hideConfidentielFilter({
              fichierIdColumn: preuveAuditTable.fichierId,
              confidentielColumn: fichier.confidentiel,
              canReadConfidentiel,
            })
          )
        )
        .orderBy(preuveAuditTable.id);

      return success(documents);
    } catch (error) {
      this.logger.error(
        `Echec de la lecture des documents d'audit du referentiel ${referentielId} de la collectivite ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(ListDocumentsErrorEnum.DATABASE_ERROR);
    }
  }

  async listRapportDocuments(
    {
      collectiviteId,
      canReadConfidentiel,
    }: Omit<DocumentsScope, 'referentielId'>,
    tx?: Transaction
  ) {
    const db = tx ?? this.databaseService.db;
    const fichier = buildFichierSubquery(db);

    try {
      const documents = await db
        .select({
          ...getTableColumns(preuveRapportTable),
          fichier: buildFileInfoSql(fichier),
          modifiedByNom: createdByNom,
          preuveType: sql<'rapport'>`'rapport'`,
          rapport: sql<{
            date: string;
          }>`json_build_object('date', ${preuveRapportTable.date})`,
        })
        .from(preuveRapportTable)
        .leftJoin(
          fichier,
          and(
            eq(preuveRapportTable.fichierId, fichier.id),
            eq(fichier.collectiviteId, collectiviteId)
          )
        )
        .leftJoin(dcpTable, eq(preuveRapportTable.modifiedBy, dcpTable.id))
        .where(
          and(
            eq(preuveRapportTable.collectiviteId, collectiviteId),
            hideConfidentielFilter({
              fichierIdColumn: preuveRapportTable.fichierId,
              confidentielColumn: fichier.confidentiel,
              canReadConfidentiel,
            })
          )
        )
        .orderBy(desc(preuveRapportTable.date), desc(preuveRapportTable.id));

      return success(documents);
    } catch (error) {
      this.logger.error(
        `Echec de la lecture des rapports de visite de la collectivite ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(ListDocumentsErrorEnum.DATABASE_ERROR);
    }
  }
}
