import { Injectable, Logger } from '@nestjs/common';
import { UpdateFicheError } from '@tet/backend/plans/fiches/update-fiche/update-fiche.errors';
import UpdateFicheService from '@tet/backend/plans/fiches/update-fiche/update-fiche.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import { InstanceGouvernance } from '@tet/domain/collectivites';
import { PermissionOperationEnum } from '@tet/domain/users';
import { Result } from './handle-instance-gouvernance.result';
import { InstanceGouvernanceService } from './handle-instance-gouvernance.service';
@Injectable()
export class CreateInstanceGouvernanceAndLinkToFicheApplicationService {
  private readonly logger = new Logger(
    CreateInstanceGouvernanceAndLinkToFicheApplicationService.name
  );

  constructor(
    private readonly instanceGouvernanceService: InstanceGouvernanceService,
    private readonly databaseService: DatabaseService,
    private readonly updateFicheService: UpdateFicheService,
    private readonly permissionService: PermissionService
  ) {}

  async execute(request: {
    nom: string;
    ficheId: number;
    collectiviteId: number;
    user: AuthenticatedUser;
  }): Promise<Result<InstanceGouvernance, UpdateFicheError | CommonError>> {
    const isAllowed = await this.permissionService.isAllowed(
      request.user,
      PermissionOperationEnum['PLANS.FICHES.UPDATE'],
      ResourceType.COLLECTIVITE,
      request.collectiviteId
    );
    if (!isAllowed) {
      return {
        success: false,
        error: CommonErrorEnum.UNAUTHORIZED,
      };
    }
    const result = await this.databaseService.db.transaction(async (tx) => {
      const instanceGouvernanceResult =
        await this.instanceGouvernanceService.create({
          nom: request.nom,
          collectiviteId: request.collectiviteId,
          user: request.user,
          tx,
        });
      if (instanceGouvernanceResult.success === false) {
        return instanceGouvernanceResult;
      }
      const instanceGouvernance = instanceGouvernanceResult.data;
      const ficheActionResult = await this.updateFicheService.updateFiche({
        ficheId: request.ficheId,
        ficheFields: {
          instanceGouvernance: [{ id: instanceGouvernance.id }],
        },
        user: request.user,
        tx,
      });
      if (ficheActionResult.success === false) {
        return ficheActionResult;
      }
      return instanceGouvernanceResult;
    });

    if (result.success === false) {
      this.logger.error(
        `Failed to create instance gouvernance and link to fiche`,
        JSON.stringify({ ctx: request, ...result }, null, 2)
      );
    }

    return result;
  }
}
