import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import {
  catchDatabaseFailure,
  toDatabaseFailure,
} from '@tet/backend/utils/database/catch-database-failure';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { ResourceType } from '@tet/domain/users';
import { PermissionService } from '../../../users/authorizations/permission.service';
import { GetFavorisCountRequest } from './get-favoris-count.request';
import { GetPathRequest } from './get-path.request';
import { ListIndicateursInput } from './list-indicateurs.input';
import {
  ListIndicateursError,
  readOperation,
  toIndicateurNotFoundFailure,
  toReadPermissionDeniedFailure,
} from './list-indicateurs.errors';
import { ListIndicateursOutput } from './list-indicateurs.output';
import { ListIndicateursRepository } from './list-indicateurs.repository';

type IndicateurPath = Awaited<ReturnType<ListIndicateursRepository['getPath']>>;

@Injectable()
export class ListIndicateursService {
  private readonly logger = new Logger(ListIndicateursService.name);

  constructor(
    private readonly repository: ListIndicateursRepository,
    private readonly permissionService: PermissionService
  ) {}

  async getIndicateur({
    indicateurId,
    collectiviteId,
  }: {
    indicateurId: number;
    collectiviteId: number;
  }): Promise<Result<IndicateurDetaille, ListIndicateursError>> {
    const listResult = await this.listIndicateurs({
      collectiviteId,
      filters: { indicateurIds: [indicateurId] },
      queryOptions: { page: 1, limit: 1 },
    });
    if (!listResult.success) return listResult;

    if (listResult.data.data.length === 0) {
      return toIndicateurNotFoundFailure(`id ${indicateurId}`);
    }
    return success(listResult.data.data[0]);
  }

  async getIndicateurByIdentifiantReferentiel({
    identifiantReferentiel,
    collectiviteId,
  }: {
    identifiantReferentiel: string;
    collectiviteId: number;
  }): Promise<Result<IndicateurDetaille, ListIndicateursError>> {
    const listResult = await this.listIndicateurs({
      collectiviteId,
      filters: { identifiantsReferentiel: [identifiantReferentiel] },
      queryOptions: { page: 1, limit: 1 },
    });
    if (!listResult.success) return listResult;

    if (listResult.data.data.length === 0) {
      return toIndicateurNotFoundFailure(
        `identifiant referentiel ${identifiantReferentiel}`
      );
    }
    return success(listResult.data.data[0]);
  }

  listIndicateurs(
    { collectiviteId, filters, queryOptions }: ListIndicateursInput,
    user?: AuthUser
  ): Promise<Result<ListIndicateursOutput, ListIndicateursError>> {
    return catchDatabaseFailure(async () => {
      if (user) {
        const readPermission = await this.checkReadAllowed(
          user,
          collectiviteId
        );
        if (!readPermission.success) return readPermission;
      }

      this.logger.log(
        `Lecture des définitions détaillées d'indicateur id ${[
          ...(filters.indicateurIds || []),
          filters.identifiantsReferentiel || [],
        ].join(',')} pour la collectivité ${collectiviteId}`
      );

      const indicateursResult = await this.repository.listIndicateurs({
        collectiviteId,
        filters,
        queryOptions,
      });
      if (!indicateursResult.success) {
        this.logger.error(
          "Lecture des définitions d'indicateur en échec",
          indicateursResult.cause
        );
        return toDatabaseFailure(indicateursResult);
      }
      const indicateurs = indicateursResult.data;

      this.logger.log(`${indicateurs.length} définitions trouvées`);

      const count = indicateurs[0]?.count ?? 0;

      return success({
        data: indicateurs.map(({ count: _count, ...indicateur }) => indicateur),
        count,
        page: queryOptions.page,
        pageSize: queryOptions.limit,
        pageCount: Math.ceil(count / queryOptions.limit),
      });
    });
  }

  /**
   * Donne le chemin d'un indicateur à partir de son id
   */
  getPath(
    data: GetPathRequest,
    tokenInfo: AuthUser
  ): Promise<Result<IndicateurPath, ListIndicateursError>> {
    const { collectiviteId, indicateurId } = data;
    return catchDatabaseFailure(async () => {
      const readPermission = await this.checkReadAllowed(
        tokenInfo,
        collectiviteId
      );
      if (!readPermission.success) return readPermission;

      this.logger.log(
        `Lecture du chemin de l'indicateur id ${indicateurId} pour la collectivité ${collectiviteId}`
      );

      const chemin = await this.repository.getPath(indicateurId);

      this.logger.log(`chemin ${chemin ? '' : 'non'} trouvé`);

      return success(chemin);
    });
  }

  /** Donne le nombre d'indicateurs favoris de la collectivité */
  getFavorisCount(
    data: GetFavorisCountRequest,
    tokenInfo: AuthUser
  ): Promise<Result<number, ListIndicateursError>> {
    const { collectiviteId } = data;
    return catchDatabaseFailure(async () => {
      const readPermission = await this.checkReadAllowed(
        tokenInfo,
        collectiviteId
      );
      if (!readPermission.success) return readPermission;

      this.logger.log(
        `Lecture du nombre d'indicateurs favoris de la collectivité ${collectiviteId}`
      );

      return success(await this.repository.getFavorisCount(collectiviteId));
    });
  }

  getPersonnalisesCount(
    data: GetFavorisCountRequest,
    tokenInfo: AuthUser
  ): Promise<Result<number, ListIndicateursError>> {
    const { collectiviteId } = data;
    return catchDatabaseFailure(async () => {
      const readPermission = await this.checkReadAllowed(
        tokenInfo,
        collectiviteId
      );
      if (!readPermission.success) return readPermission;

      this.logger.log(
        `Lecture du nombre d'indicateurs personnalises de la collectivité ${collectiviteId}`
      );

      return success(
        await this.repository.getPersonnalisesCount(collectiviteId)
      );
    });
  }

  /** Donne le nombre d'indicateurs dont l'utilisateur est pilote */
  async getMesIndicateursCount(
    data: GetFavorisCountRequest,
    tokenInfo: AuthUser
  ): Promise<Result<number, ListIndicateursError>> {
    const { collectiviteId } = data;
    const userId = tokenInfo.id;
    if (!userId) {
      return failure('UNAUTHORIZED', new Error('Id utilisateur non valide'));
    }
    return catchDatabaseFailure(async () => {
      const readPermission = await this.checkReadAllowed(
        tokenInfo,
        collectiviteId
      );
      if (!readPermission.success) return readPermission;

      this.logger.log(
        `Lecture du nombre d'indicateurs dont l'utilisateur ${userId} est pilote pour la collectivité ${collectiviteId}`
      );

      return success(
        await this.repository.getMesIndicateursCount(collectiviteId, userId)
      );
    });
  }

  private async checkReadAllowed(
    user: AuthUser,
    collectiviteId: number
  ): Promise<Result<void, 'UNAUTHORIZED'>> {
    const permission = await this.permissionService.isAllowed(
      user,
      readOperation,
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    if (permission.success) return success(undefined);
    return toReadPermissionDeniedFailure({
      userId: user.id,
      collectiviteId,
      isApiKeyDenied: !this.permissionService.isApiKeyAllowed(
        user,
        readOperation
      ).success,
      operation: readOperation,
    });
  }
}
