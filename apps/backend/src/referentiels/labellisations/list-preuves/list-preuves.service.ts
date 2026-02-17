import { Injectable, Logger } from '@nestjs/common';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { storageObjectTable } from '@tet/backend/collectivites/documents/models/storage-object.table';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { createdByNom, dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result } from '@tet/backend/utils/result.type';
import {
  BibliothequeFichier,
  LegacyPreuveAuditWithFichier,
  LegacyPreuveLabellisationWithFichier,
} from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, getTableColumns, sql } from 'drizzle-orm';
import { ObjectToSnake, objectToSnake } from 'ts-case-convert';
import { auditTable } from '../audit.table';
import {
  CreateLabellisationPreuveError,
  CreateLabellisationPreuveErrorEnum,
} from '../create-preuve/create-labellisation-preuve.errors';
import { GetLabellisationService } from '../get-labellisation.service';
import { labellisationDemandeTable } from '../labellisation-demande.table';
import {
  ListPreuvesAuditError,
  ListPreuvesAuditErrorEnum,
} from './list-preuves-audit.errors';
import { ListPreuvesAuditInput } from './list-preuves-audit.input';
import { ListPreuvesLabellisationInput } from './list-preuves-labellisation.input';

@Injectable()
export class ListPreuvesService {
  private readonly logger = new Logger(ListPreuvesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissions: PermissionService,
    private readonly getLabellisationService: GetLabellisationService
  ) {}

  async listPreuvesAudit(
    { auditId }: ListPreuvesAuditInput,
    user: AuthenticatedUser
  ): Promise<
    Result<ObjectToSnake<LegacyPreuveAuditWithFichier>[], ListPreuvesAuditError>
  > {
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
    // Check permissions
    const isAllowed = await this.permissions.isAllowed(
      user,
      'referentiels.read',
      ResourceType.COLLECTIVITE,
      auditData.collectiviteId,
      true
    );
    if (!isAllowed) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
      };
    }

    try {
      // Get the preuve
      const preuves = await this.databaseService.db
        .select({
          ...getTableColumns(preuveAuditTable),
          fichier: this.getFileInfoSql(),
          demande: {
            ...getTableColumns(labellisationDemandeTable),
          },
          audit: {
            ...getTableColumns(auditTable),
          },
          createdBy: preuveAuditTable.modifiedBy,
          createdAt: preuveAuditTable.modifiedAt,
          createdByNom: createdByNom,
          // Below for legacy reason, to be removed when front is updated
          preuveType: sql<'audit'>`'audit'`,
          action: sql<null>`null`,
          preuveReglementaire: sql<null>`null`,
          rapport: sql<null>`null`,
        })
        .from(preuveAuditTable)
        .leftJoin(
          bibliothequeFichierTable,
          eq(preuveAuditTable.fichierId, bibliothequeFichierTable.id)
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
        .leftJoin(auditTable, eq(preuveAuditTable.auditId, auditTable.id))
        .leftJoin(
          labellisationDemandeTable,
          eq(auditTable.demandeId, labellisationDemandeTable.id)
        )
        .leftJoin(dcpTable, eq(preuveAuditTable.modifiedBy, dcpTable.id))
        .where(eq(preuveAuditTable.auditId, auditId));

      return {
        success: true,
        data: preuves.map((preuve) => objectToSnake(preuve)),
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
    Result<
      ObjectToSnake<LegacyPreuveLabellisationWithFichier>[],
      CreateLabellisationPreuveError
    >
  > {
    const demandeResult = await this.getLabellisationService.getDemande(
      demandeId
    );
    if (!demandeResult.success) {
      if (demandeResult.error === 'NOT_FOUND') {
        return {
          success: false,
          error: CreateLabellisationPreuveErrorEnum.DEMANDE_NOT_FOUND,
        };
      } else {
        return {
          success: false,
          error: demandeResult.error,
        };
      }
    }
    const demande = demandeResult.data;

    // Check permissions
    const isAllowed = await this.permissions.isAllowed(
      user,
      'referentiels.read',
      ResourceType.COLLECTIVITE,
      demande.collectiviteId,
      true
    );
    if (!isAllowed) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
      };
    }

    try {
      // Get the preuve
      const preuves = await this.databaseService.db
        .select({
          ...getTableColumns(preuveLabellisationTable),
          fichier: this.getFileInfoSql(),
          demande: {
            ...getTableColumns(labellisationDemandeTable),
          },
          createdBy: preuveLabellisationTable.modifiedBy,
          createdAt: preuveLabellisationTable.modifiedAt,
          createdByNom: createdByNom,
          // Below for legacy reason, to be removed when front is updated
          preuveType: sql<'labellisation'>`'labellisation'`,
          action: sql<null>`null`,
          preuveReglementaire: sql<null>`null`,
          rapport: sql<null>`null`,
          audit: sql<null>`null`,
        })
        .from(preuveLabellisationTable)
        .leftJoin(
          bibliothequeFichierTable,
          eq(preuveLabellisationTable.fichierId, bibliothequeFichierTable.id)
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
        .leftJoin(
          labellisationDemandeTable,
          eq(preuveLabellisationTable.demandeId, labellisationDemandeTable.id)
        )
        .leftJoin(
          dcpTable,
          eq(preuveLabellisationTable.modifiedBy, dcpTable.id)
        )
        .where(eq(preuveLabellisationTable.demandeId, demandeId));

      return {
        success: true,
        data: preuves.map((preuve) => objectToSnake(preuve)),
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

  private getFileInfoSql() {
    return sql<
      | (BibliothequeFichier & {
          bucketId: string;
        })
      | null
    >`
      CASE WHEN ${bibliothequeFichierTable.id} IS NULL THEN NULL
      ELSE json_build_object(
        'id', ${bibliothequeFichierTable.id},
        'collectiviteId', ${bibliothequeFichierTable.collectiviteId},
        'hash', ${bibliothequeFichierTable.hash},
        'filename', ${bibliothequeFichierTable.filename},
        'confidentiel', ${bibliothequeFichierTable.confidentiel},
        'bucketId', ${collectiviteBucketTable.bucketId},
        'filesize', (${storageObjectTable.metadata}->>'size')::integer
      )
      END
    `;
  }
}
