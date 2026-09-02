import { Injectable, Logger } from '@nestjs/common';
import {
  buildFichierSubquery,
  buildFileInfoSql,
} from '@tet/backend/collectivites/documents/file-info.utils';
import { hideConfidentielFilter } from '@tet/backend/collectivites/documents/hide-confidentiel.utils';
import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { createdByNom, dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, getTableColumns, sql } from 'drizzle-orm';
import { auditTable } from '../audit.table';
import { labellisationDemandeTable } from '../labellisation-demande.table';
import { ListPreuvesAuditErrorEnum } from './list-preuves-audit.errors';
import { ListPreuvesLabellisationErrorEnum } from './list-preuves-labellisation.errors';

type AuditScope = {
  auditId: number;
  canReadConfidentiel: boolean;
};

type LabellisationScope = {
  demandeId: number;
  canReadConfidentiel: boolean;
};

@Injectable()
export class ListPreuvesRepository {
  private readonly logger = new Logger(ListPreuvesRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listPreuvesAudit({ auditId, canReadConfidentiel }: AuditScope) {
    const db = this.databaseService.db;
    const fichier = buildFichierSubquery(db);

    try {
      const preuves = await db
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
        .leftJoin(fichier, eq(preuveAuditTable.fichierId, fichier.id))
        .innerJoin(auditTable, eq(preuveAuditTable.auditId, auditTable.id))
        .leftJoin(
          labellisationDemandeTable,
          eq(auditTable.demandeId, labellisationDemandeTable.id)
        )
        .leftJoin(dcpTable, eq(preuveAuditTable.modifiedBy, dcpTable.id))
        .where(
          and(
            eq(preuveAuditTable.auditId, auditId),
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
        `Echec de la lecture des preuves de l'audit ${auditId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(ListPreuvesAuditErrorEnum.DATABASE_ERROR);
    }
  }

  async listPreuvesLabellisation({
    demandeId,
    canReadConfidentiel,
  }: LabellisationScope) {
    const db = this.databaseService.db;
    const fichier = buildFichierSubquery(db);

    try {
      const preuves = await db
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
        .leftJoin(fichier, eq(preuveLabellisationTable.fichierId, fichier.id))
        .leftJoin(
          labellisationDemandeTable,
          eq(preuveLabellisationTable.demandeId, labellisationDemandeTable.id)
        )
        .leftJoin(
          dcpTable,
          eq(preuveLabellisationTable.modifiedBy, dcpTable.id)
        )
        .where(
          and(
            eq(preuveLabellisationTable.demandeId, demandeId),
            hideConfidentielFilter({
              fichierIdColumn: preuveLabellisationTable.fichierId,
              confidentielColumn: fichier.confidentiel,
              canReadConfidentiel,
            })
          )
        )
        // Ordre stable par id croissant : le front traite `preuves[0]` comme
        // l'acte d'engagement (déposé en premier), il faut donc un ordre
        // déterministe et non l'ordre physique arbitraire de Postgres.
        .orderBy(preuveLabellisationTable.id);

      return success(preuves);
    } catch (error) {
      this.logger.error(
        `Echec de la lecture des preuves de la demande ${demandeId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(ListPreuvesLabellisationErrorEnum.DATABASE_ERROR);
    }
  }
}
