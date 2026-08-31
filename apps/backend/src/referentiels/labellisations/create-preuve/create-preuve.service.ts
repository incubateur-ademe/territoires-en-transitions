import { Injectable, Logger } from '@nestjs/common';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result, failure } from '@tet/backend/utils/result.type';
import { PreuveLabellisation } from '@tet/domain/collectivites';
import { canModifyCandidatureDocuments } from '@tet/domain/referentiels';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq } from 'drizzle-orm';
import { GetLabellisationService } from '../get-labellisation.service';
import {
  CreateLabellisationPreuveError,
  CreateLabellisationPreuveErrorEnum,
} from './create-labellisation-preuve.errors';
import { CreateLabellisationPreuveInput } from './create-labellisation-preuve.input';

@Injectable()
export class CreatePreuveService {
  private readonly logger = new Logger(CreatePreuveService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissions: PermissionService,
    private readonly getLabellisationService: GetLabellisationService
  ) {}

  async createLabellisationPreuve(
    input: CreateLabellisationPreuveInput,
    user: AuthenticatedUser
  ): Promise<Result<PreuveLabellisation, CreateLabellisationPreuveError>> {
    const { fichierId, commentaire, demandeId, objet } = input;

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

    const permissionResult = await this.permissions.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.MUTATE'],
      ResourceType.REFERENTIEL,
      {
        collectiviteId: demande.collectiviteId,
        referentielId: demande.referentiel,
      }
    );
    if (!permissionResult.success) {
      return failure(permissionResult.error);
    }

    const auditResult = await this.getLabellisationService.getAuditByDemande(
      demandeId
    );
    if (!auditResult.success && auditResult.error === 'DATABASE_ERROR') {
      return {
        success: false,
        error: CreateLabellisationPreuveErrorEnum.DATABASE_ERROR,
      };
    }
    if (
      auditResult.success &&
      canModifyCandidatureDocuments({ audit: auditResult.data }) === false
    ) {
      return {
        success: false,
        error: CreateLabellisationPreuveErrorEnum.LABELLISATION_IN_PROGRESS,
      };
    }

    try {
      const matchingFichiers = await this.databaseService.db
        .select({ id: bibliothequeFichierTable.id })
        .from(bibliothequeFichierTable)
        .where(
          and(
            eq(bibliothequeFichierTable.id, fichierId),
            eq(bibliothequeFichierTable.collectiviteId, demande.collectiviteId)
          )
        )
        .limit(1);

      if (matchingFichiers.length === 0) {
        return failure(CreateLabellisationPreuveErrorEnum.FICHIER_NOT_FOUND);
      }

      const preuve = {
        collectiviteId: demande.collectiviteId,
        demandeId: demandeId,
        fichierId: fichierId,
        commentaire: commentaire ?? '',
        objet: objet ?? null,
        modifiedBy: user.id,
      };

      const rows = await this.databaseService.db
        .insert(preuveLabellisationTable)
        .values(preuve)
        .returning();

      return {
        success: true,
        data: rows[0],
      };
    } catch (error) {
      this.logger.error(error);
      this.logger.error(
        `Error creating demande preuve: ${getErrorMessage(error)}`
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
