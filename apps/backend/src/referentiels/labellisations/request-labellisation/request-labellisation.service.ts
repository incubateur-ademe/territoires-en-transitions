import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result } from '@tet/backend/utils/result.type';
import {
  canRequestAuditOrLabellisation,
  EtoileAsString,
} from '@tet/domain/referentiels';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { GetLabellisationService } from '../get-labellisation.service';
import { labellisationDemandeTable } from '../labellisation-demande.table';
import {
  RequestLabellisationError,
  RequestLabellisationErrorEnum,
} from './request-labellisation.errors';
import { RequestLabellisationInput } from './request-labellisation.input';
import { RequestLabellisationOutput } from './request-labellisation.output';

@Injectable()
export class RequestLabellisationService {
  private readonly logger = new Logger(RequestLabellisationService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissions: PermissionService,
    private readonly labellisations: GetLabellisationService
  ) {}

  private readonly db = this.databaseService.db;

  /**
   * Équivalent de la fonction PG `labellisation_submit_demande()`
   * Soumet une demande de labellisation ou d'audit
   */
  async requestLabellisation(
    input: RequestLabellisationInput,
    user: AuthenticatedUser
  ): Promise<Result<RequestLabellisationOutput, RequestLabellisationError>> {
    const { collectiviteId, referentiel, sujet, etoiles } = input;

    const isAllowed = await this.permissions.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.LABELLISATIONS.REQUEST'],
      ResourceType.COLLECTIVITE,
      input.collectiviteId,
      true
    );
    if (!isAllowed) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
      };
    }

    const labellisation = await this.labellisations.getParcoursLabellisation({
      collectiviteId,
      referentielId: referentiel,
    });

    // Vérifie si la demande peut être faite
    const canRequestResult = canRequestAuditOrLabellisation(
      labellisation,
      sujet,
      etoiles
    );
    if (!canRequestResult.canRequest) {
      this.logger.error(
        `Cannot request audit or labellisation: ${canRequestResult.reason}`
      );
      return {
        success: false,
        error: canRequestResult.reason,
      };
    }

    if (!labellisation.demande?.id) {
      this.logger.error('No demande found for this labellisation');
      return {
        success: false,
        error: RequestLabellisationErrorEnum.DEMANDE_NOT_FOUND,
      };
    }

    try {
      const updatedDemande = await this.db
        .update(labellisationDemandeTable)
        .set({
          etoiles: !etoiles ? null : (etoiles?.toString() as EtoileAsString),
          sujet,
          enCours: false,
          demandeur: user.id,
          envoyeeLe: DateTime.now().toISO(),
        })
        .where(eq(labellisationDemandeTable.id, labellisation.demande.id))
        .returning()
        .then((rows) => rows[0]);

      if (!updatedDemande) {
        this.logger.error('No demande updated');
        return {
          success: false,
          error: RequestLabellisationErrorEnum.DEMANDE_NOT_FOUND,
        };
      }

      return {
        success: true,
        data: updatedDemande,
      };
    } catch (error) {
      this.logger.error('Error requesting audit', error);
      return {
        success: false,
        error: RequestLabellisationErrorEnum.DATABASE_ERROR,
        cause: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}
