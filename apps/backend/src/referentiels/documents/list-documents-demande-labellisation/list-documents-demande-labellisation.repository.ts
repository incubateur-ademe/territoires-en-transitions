import { Injectable, Logger } from '@nestjs/common';
import {
  buildFichierSubquery,
  buildFileInfoSql,
} from '@tet/backend/collectivites/documents/file-info.utils';
import { hideConfidentielFilter } from '@tet/backend/collectivites/documents/hide-confidentiel.utils';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { createdByNom, dcpTable } from '@tet/backend/users/models/dcp.table';
import { sqlToDate, sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, getTableColumns, sql } from 'drizzle-orm';
import { labellisationDemandeTable } from '../../labellisations/labellisation-demande.table';
import { ListDocumentsDemandeLabellisationErrorEnum } from './list-documents-demande-labellisation.errors';

type DemandeScope = {
  collectiviteId: number;
  demandeId: number;
  canReadConfidentiel: boolean;
};

@Injectable()
export class ListDocumentsDemandeLabellisationRepository {
  private readonly logger = new Logger(
    ListDocumentsDemandeLabellisationRepository.name
  );

  constructor(private readonly databaseService: DatabaseService) {}

  async listDocumentsDemandeLabellisation({
    collectiviteId,
    demandeId,
    canReadConfidentiel,
  }: DemandeScope) {
    const db = this.databaseService.db;
    const fichier = buildFichierSubquery(db);

    try {
      const preuves = await db
        .select({
          ...getTableColumns(preuveLabellisationTable),
          modifiedAt: sqlToDateTimeISO(preuveLabellisationTable.modifiedAt),
          fichier: buildFileInfoSql(fichier),
          demande: {
            ...getTableColumns(labellisationDemandeTable),
            date: sqlToDate(labellisationDemandeTable.date),
            modifiedAt: sqlToDateTimeISO(labellisationDemandeTable.modifiedAt),
            envoyeeLe: sqlToDateTimeISO(labellisationDemandeTable.envoyeeLe),
          },
          modifiedByNom: createdByNom,
          preuveType: sql<'labellisation'>`'labellisation'`,
        })
        .from(preuveLabellisationTable)
        .leftJoin(
          fichier,
          and(
            eq(preuveLabellisationTable.fichierId, fichier.id),
            eq(fichier.collectiviteId, collectiviteId)
          )
        )
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
            eq(preuveLabellisationTable.collectiviteId, collectiviteId),
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
        `Echec de la lecture des documents de la demande ${demandeId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(ListDocumentsDemandeLabellisationErrorEnum.DATABASE_ERROR);
    }
  }
}
