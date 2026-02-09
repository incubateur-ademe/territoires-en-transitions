import { Injectable, Logger } from '@nestjs/common';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { storageObjectTable } from '@tet/backend/collectivites/documents/models/storage-object.table';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { createdByNom, dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result } from '@tet/backend/utils/result.type';
import { LegacyPreuveLabellisationWithFichier } from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, getTableColumns, sql } from 'drizzle-orm';
import { ObjectToSnake, objectToSnake } from 'ts-case-convert';
import {
  CreateLabellisationPreuveError,
  CreateLabellisationPreuveErrorEnum,
} from '../create-preuve/create-labellisation-preuve.errors';
import { GetLabellisationService } from '../get-labellisation.service';
import { labellisationDemandeTable } from '../labellisation-demande.table';
import { ListePreuvesLabellisationInput } from './liste-preuves.input';

@Injectable()
export class ListePreuvesService {
  private readonly logger = new Logger(ListePreuvesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissions: PermissionService,
    private readonly getLabellisationService: GetLabellisationService
  ) {}

  async listPreuvesLabellisation(
    { demandeId }: ListePreuvesLabellisationInput,
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
          fichier: sql<{
            id: number;
            collectiviteId: number | null;
            hash: string | null;
            filename: string | null;
            confidentiel: boolean | null;
            bucketId: string;
          } | null>`
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
            END AS fichier
          `,
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
        .innerJoin(
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
        error: CreateLabellisationPreuveErrorEnum.DATABASE_ERROR,
        cause:
          error instanceof Error ? error : new Error(getErrorMessage(error)),
      };
    }
  }
}
