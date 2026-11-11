import { Injectable, Logger } from '@nestjs/common';
import { GetUserRolesAndPermissionsService } from '@tet/backend/users/authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  ElectrificationConfig,
  ElectrificationLaureatsConfig,
} from '@tet/domain/plans';
import { hasRole, PlatformRole } from '@tet/domain/users';
import { ElectrificationDataError } from './electrification-data.errors';
import { ElectrificationDataService } from './electrification-data.service';
import {
  ElectrificationDataIssue,
  GetElectrificationDataInput,
  PublishElectrificationDataInput,
  PrepareElectrificationDataInput,
} from './publish-electrification-data.input';
import { PrepareElectrificationDataService } from './prepare-electrification-data.service';
import { ValidateElectrificationDataService } from './validate-electrification-data.service';

@Injectable()
export class PublishElectrificationDataService {
  private readonly logger = new Logger(PublishElectrificationDataService.name);

  constructor(
    private readonly data: ElectrificationDataService,
    private readonly permissions: GetUserRolesAndPermissionsService,
    private readonly preparation: PrepareElectrificationDataService,
    private readonly validation: ValidateElectrificationDataService
  ) {}

  async prepare(
    input: PrepareElectrificationDataInput,
    context: ServiceSecondArg
  ) {
    const authorized = await this.authorize(context);
    if (!authorized.success) return authorized;
    return this.preparation.prepare(input);
  }

  async get(
    input: GetElectrificationDataInput,
    context: ServiceSecondArg
  ): Promise<
    Result<
      ElectrificationConfig | ElectrificationLaureatsConfig,
      ElectrificationDataError
    >
  > {
    const authorized = await this.authorize(context);
    if (!authorized.success) return authorized;
    return input.kind === 'catalogue'
      ? this.data.getCatalogue(input.version)
      : this.data.getLaureats(input.version);
  }

  async verify(
    input: PublishElectrificationDataInput,
    context: ServiceSecondArg
  ): Promise<
    Result<
      { valid: boolean; issues: ElectrificationDataIssue[] },
      ElectrificationDataError
    >
  > {
    const authorized = await this.authorize(context);
    if (!authorized.success) return authorized;
    try {
      const checked = await this.validation.validate(input);
      return success({
        valid: checked.success,
        issues: checked.success ? [] : checked.error,
      });
    } catch (error) {
      this.logger.error(
        'Impossible de vérifier les données Électrification',
        error
      );
      return failure('DATABASE_ERROR');
    }
  }

  async publish(
    input: PublishElectrificationDataInput,
    context: ServiceSecondArg
  ): Promise<Result<{ version: string }, ElectrificationDataError>> {
    const authorized = await this.authorize(context);
    if (!authorized.success) return authorized;
    try {
      // Toujours revérifier le document reçu, indépendamment d'un aperçu précédent.
      const checked = await this.validation.validate(input);
      if (!checked.success) {
        return failure(
          'INVALID_DATA',
          new Error(
            checked.error
              .map(({ location, message }) => `${location}: ${message}`)
              .join('\n')
          )
        );
      }
      return this.data.publish(checked.data.kind, checked.data.data, {
        publishedBy: context.user.id,
      });
    } catch (error) {
      this.logger.error(
        'Impossible de vérifier les données avant publication',
        error
      );
      return failure('DATABASE_ERROR');
    }
  }

  private async authorize({
    user,
    tx,
  }: ServiceSecondArg): Promise<Result<void, ElectrificationDataError>> {
    // Cette administration exige une session humaine, pas les droits du compte
    // porteur d'une clé API ou d'un jeton à permissions limitées.
    if (
      user.jwtPayload.client_id !== undefined ||
      user.jwtPayload.permissions !== undefined
    ) {
      return failure('UNAUTHORIZED');
    }
    try {
      const roles = await this.permissions.getUserRolesAndPermissions({
        userId: user.id,
        tx,
      });
      return roles.success && hasRole(roles.data, PlatformRole.SUPER_ADMIN)
        ? success(undefined)
        : failure('UNAUTHORIZED');
    } catch (error) {
      this.logger.error(
        'Impossible de vérifier les droits de publication',
        error
      );
      return failure('DATABASE_ERROR');
    }
  }
}
