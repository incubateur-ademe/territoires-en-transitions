import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { ResourceType } from '@tet/domain/users';
import assert from 'assert';
import { omit } from 'es-toolkit';
import { PermissionService } from '../../../users/authorizations/permission.service';
import { GetFavorisCountRequest } from './get-favoris-count.request';
import { GetPathRequest } from './get-path.request';
import { ListIndicateursInput } from './list-indicateurs.input';
import {
  IndicateurListItem,
  ListIndicateursOutput,
} from './list-indicateurs.output';
import { ListIndicateursRepository } from './list-indicateurs.repository';

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
  }): Promise<IndicateurListItem> {
    const indicateurs = await this.listIndicateurs({
      collectiviteId,
      filters: { indicateurIds: [indicateurId] },
      queryOptions: { page: 1, limit: 1 },
    });

    if (indicateurs.data.length === 0) {
      throw new BadRequestException(
        `Indicateur not found for id ${indicateurId}`
      );
    }
    return indicateurs.data[0];
  }

  async getIndicateurByIdentifiantReferentiel({
    identifiantReferentiel,
    collectiviteId,
  }: {
    identifiantReferentiel: string;
    collectiviteId: number;
  }): Promise<IndicateurListItem> {
    const indicateurs = await this.listIndicateurs({
      collectiviteId,
      filters: { identifiantsReferentiel: [identifiantReferentiel] },
      queryOptions: { page: 1, limit: 1 },
    });

    if (indicateurs.data.length === 0) {
      throw new BadRequestException(
        `Indicateur not found for identifiant referentiel ${identifiantReferentiel}`
      );
    }
    return indicateurs.data[0];
  }

  async listIndicateurs(
    { collectiviteId, filters, queryOptions }: ListIndicateursInput,
    user?: AuthUser
  ): Promise<ListIndicateursOutput> {
    if (user) {
      await this.permissionService.assertAllowed(
        user,
        'indicateurs.indicateurs.read',
        ResourceType.COLLECTIVITE,
        { collectiviteId }
      );
    }

    this.logger.log(
      `Lecture des définitions détaillées d'indicateur id ${[
        ...(filters.indicateurIds || []),
        filters.identifiantsReferentiel || [],
      ].join(',')} pour la collectivité ${collectiviteId}`
    );

    const definitionsResult = await this.repository.listIndicateurs({
      collectiviteId,
      filters,
      queryOptions,
    });

    this.logger.log(`${definitionsResult.length} définitions trouvées`);

    const count = definitionsResult[0]?.count ?? 0;

    return {
      data: definitionsResult.map((d) => omit(d, ['count'])),
      count,
      page: queryOptions.page,
      pageSize: queryOptions.limit,
      pageCount: Math.ceil(count / queryOptions.limit),
    };
  }

  /**
   * Donne le chemin d'un indicateur à partir de son id
   */
  async getPath(data: GetPathRequest, tokenInfo: AuthUser) {
    const { collectiviteId, indicateurId } = data;
    await this.permissionService.assertAllowed(
      tokenInfo,
      'indicateurs.indicateurs.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );

    this.logger.log(
      `Lecture du chemin de l'indicateur id ${indicateurId} pour la collectivité ${collectiviteId}`
    );

    const chemin = await this.repository.getPath(indicateurId);

    this.logger.log(`chemin ${chemin ? '' : 'non'} trouvé`);

    return chemin;
  }

  /** Donne le nombre d'indicateurs favoris de la collectivité */
  async getFavorisCount(data: GetFavorisCountRequest, tokenInfo: AuthUser) {
    const { collectiviteId } = data;
    await this.permissionService.assertAllowed(
      tokenInfo,
      'indicateurs.indicateurs.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );

    this.logger.log(
      `Lecture du nombre d'indicateurs favoris de la collectivité ${collectiviteId}`
    );

    return this.repository.getFavorisCount(collectiviteId);
  }

  async getPersonnalisesCount(
    data: GetFavorisCountRequest,
    tokenInfo: AuthUser
  ) {
    const { collectiviteId } = data;
    await this.permissionService.assertAllowed(
      tokenInfo,
      'indicateurs.indicateurs.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );

    this.logger.log(
      `Lecture du nombre d'indicateurs personnalises de la collectivité ${collectiviteId}`
    );

    return this.repository.getPersonnalisesCount(collectiviteId);
  }

  /** Donne le nombre d'indicateurs dont l'utilisateur est pilote */
  async getMesIndicateursCount(
    data: GetFavorisCountRequest,
    tokenInfo: AuthUser
  ) {
    assert(tokenInfo.id, 'Id utilisateur non valide');
    const { collectiviteId } = data;
    await this.permissionService.assertAllowed(
      tokenInfo,
      'indicateurs.indicateurs.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );

    this.logger.log(
      `Lecture du nombre d'indicateurs dont l'utilisateur ${tokenInfo.id} est pilote pour la collectivité ${collectiviteId}`
    );

    return this.repository.getMesIndicateursCount(collectiviteId, tokenInfo.id);
  }
}
