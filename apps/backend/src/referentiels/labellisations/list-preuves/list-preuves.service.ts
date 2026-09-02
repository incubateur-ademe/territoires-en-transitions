import { Injectable, Logger } from '@nestjs/common';
import { ReferentielDocumentsAccessService } from '../../documents/referentiel-documents-access.service';
import {
  buildFichierSubquery,
  buildFileInfoSql,
} from '@tet/backend/collectivites/documents/file-info.utils';
import { hideConfidentielFilter } from '@tet/backend/collectivites/documents/hide-confidentiel.utils';
import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { createdByNom, dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result } from '@tet/backend/utils/result.type';
import {
  LegacyPreuveAuditWithFichier,
  LegacyPreuveLabellisationWithFichier,
} from '@tet/domain/collectivites';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, getTableColumns, sql } from 'drizzle-orm';
import { auditTable } from '../audit.table';
import { GetLabellisationService } from '../get-labellisation.service';
import { labellisationDemandeTable } from '../labellisation-demande.table';
import {
  ListPreuvesAuditError,
  ListPreuvesAuditErrorEnum,
} from './list-preuves-audit.errors';
import { ListPreuvesAuditInput } from './list-preuves-audit.input';
import {
  ListPreuvesLabellisationError,
  ListPreuvesLabellisationErrorEnum,
} from './list-preuves-labellisation.errors';
import { ListPreuvesLabellisationInput } from './list-preuves-labellisation.input';

@Injectable()
export class ListPreuvesService {
  private readonly logger = new Logger(ListPreuvesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly getLabellisationService: GetLabellisationService,
    private readonly referentielDocumentsAccess: ReferentielDocumentsAccessService
  ) {}

  async listPreuvesAudit(
    { auditId }: ListPreuvesAuditInput,
    user: AuthenticatedUser
  ): Promise<Result<LegacyPreuveAuditWithFichier[], ListPreuvesAuditError>> {
    const auditResult = await this.getLabellisationService.getAudit(auditId);
    if (!auditResult.success) {
      if (auditResult.error === 'NOT_FOUND') {
        return {
          success: false,
          error: ListPreuvesAuditErrorEnum.AUDIT_NOT_FOUND,
        };
      } else {
        return {
          success: false,
          error: auditResult.error,
        };
      }
    }
    const auditData = auditResult.data;
    const accessResult =
      await this.referentielDocumentsAccess.checkUserCanReadDocuments(
        {
          collectiviteId: auditData.collectiviteId,
          referentielId: auditData.referentielId,
        },
        { user }
      );
    if (!accessResult.success) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
      };
    }

    const { canReadConfidentiel } = accessResult.data;

    try {
      // Get the preuve
      const fichier = buildFichierSubquery(this.databaseService.db);

      const preuves = await this.databaseService.db
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
        .leftJoin(auditTable, eq(preuveAuditTable.auditId, auditTable.id))
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

      return {
        success: true,
        data: preuves,
      };
    } catch (error) {
      this.logger.error(error);
      this.logger.error(
        `Error getting audit preuves: ${getErrorMessage(error)}`
      );
      return {
        success: false,
        error: ListPreuvesAuditErrorEnum.DATABASE_ERROR,
        cause:
          error instanceof Error ? error : new Error(getErrorMessage(error)),
      };
    }
  }

  async listPreuvesLabellisation(
    { demandeId }: ListPreuvesLabellisationInput,
    user: AuthenticatedUser
  ): Promise<
    Result<LegacyPreuveLabellisationWithFichier[], ListPreuvesLabellisationError>
  > {
    const demandeResult = await this.getLabellisationService.getDemande(
      demandeId
    );
    if (!demandeResult.success) {
      if (demandeResult.error === 'NOT_FOUND') {
        return {
          success: false,
          error: ListPreuvesLabellisationErrorEnum.DEMANDE_NOT_FOUND,
        };
      } else {
        return {
          success: false,
          error: demandeResult.error,
        };
      }
    }
    const demande = demandeResult.data;

    const accessResult =
      await this.referentielDocumentsAccess.checkUserCanReadDocuments(
        {
          collectiviteId: demande.collectiviteId,
          referentielId: demande.referentiel,
        },
        { user }
      );
    if (!accessResult.success) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
      };
    }

    const { canReadConfidentiel } = accessResult.data;

    try {
      // Get the preuve
      const fichier = buildFichierSubquery(this.databaseService.db);

      const preuves = await this.databaseService.db
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

      return {
        success: true,
        data: preuves,
      };
    } catch (error) {
      this.logger.error(error);
      this.logger.error(
        `Error getting labellisation preuves: ${getErrorMessage(error)}`
      );
      return {
        success: false,
        error: ListPreuvesAuditErrorEnum.DATABASE_ERROR,
        cause:
          error instanceof Error ? error : new Error(getErrorMessage(error)),
      };
    }
  }
}
