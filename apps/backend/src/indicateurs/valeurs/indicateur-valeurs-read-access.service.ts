import { Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import type { AuthUser } from '@tet/backend/users/models/auth.models';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import type { IndicateurTotalReader } from '@tet/domain/indicateurs';
import { ResourceType } from '@tet/domain/users';

export type IndicateurValeursReadDenial =
  | 'READ_DENIED'
  | 'READ_CONFIDENTIEL_DENIED';

@Injectable()
export class IndicateurValeursReadAccessService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly collectiviteService: CollectivitesService
  ) {}

  async resolveReader({
    collectiviteId,
    user,
    tx,
  }: {
    collectiviteId: number;
    user: AuthUser;
    tx?: Transaction;
  }): Promise<Result<IndicateurTotalReader, IndicateurValeursReadDenial>> {
    const isPrivate = await this.collectiviteService.isPrivate(
      collectiviteId,
      tx
    );
    const confidentialReadResult = await this.permissionService.isAllowed(
      user,
      'indicateurs.valeurs.read_confidentiel',
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    const readResult = await this.permissionService.isAllowed(
      user,
      'indicateurs.valeurs.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );

    if (isPrivate && !confidentialReadResult.success) {
      return failure('READ_CONFIDENTIEL_DENIED');
    }
    if (!readResult.success) {
      return failure('READ_DENIED');
    }
    return success(confidentialReadResult.success ? 'member' : 'visitor');
  }
}
