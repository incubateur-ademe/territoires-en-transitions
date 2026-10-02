import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { normalizeIndicateurVueFilters } from '@tet/domain/indicateurs';
import { ResourceType } from '@tet/domain/users';
import { IndicateurVueRow } from './indicateur-vue.table';
import { IndicateurVuesError } from './indicateur-vues.errors';
import {
  CreateIndicateurVueInput,
  DeleteIndicateurVueInput,
  ListIndicateurVuesInput,
  UpdateIndicateurVueInput,
} from './indicateur-vues.input';
import { IndicateurVue, toIndicateurVue } from './indicateur-vues.output';
import { IndicateurVuesRepository } from './indicateur-vues.repository';

@Injectable()
export class IndicateurVuesService {
  constructor(
    private readonly repository: IndicateurVuesRepository,
    private readonly permissions: PermissionService
  ) {}

  async list(
    { collectiviteId }: ListIndicateurVuesInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<IndicateurVue[], IndicateurVuesError>> {
    const permission = await this.permissions.isAllowed(
      user,
      'indicateurs.vues.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!permission.success) return failure('UNAUTHORIZED');

    try {
      const vues = await this.repository.list(collectiviteId, tx);
      return success(vues.map(toIndicateurVue));
    } catch (error) {
      return failure('DATABASE_ERROR', error as Error);
    }
  }

  async create(
    input: CreateIndicateurVueInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<IndicateurVue, IndicateurVuesError>> {
    const permission = await this.permissions.isAllowed(
      user,
      'indicateurs.vues.mutate',
      ResourceType.COLLECTIVITE,
      { collectiviteId: input.collectiviteId },
      tx
    );
    if (!permission.success) return failure('UNAUTHORIZED');

    try {
      const vue = await this.repository.create(
        { ...input, filtres: normalizeIndicateurVueFilters(input.filtres) },
        user.id,
        tx
      );
      return success(toIndicateurVue(vue));
    } catch (error) {
      return failure('DATABASE_ERROR', error as Error);
    }
  }

  async update(
    { id, collectiviteId, nom, filtres }: UpdateIndicateurVueInput,
    context: ServiceSecondArg
  ): Promise<Result<IndicateurVue, IndicateurVuesError>> {
    try {
      const authorized = await this.getAuthorizedVue(
        { id, collectiviteId },
        context
      );
      if (!authorized.success) return authorized;

      const vue = await this.repository.update(
        { id, collectiviteId: authorized.data.collectiviteId },
        {
          ...(nom !== undefined ? { nom } : {}),
          ...(filtres !== undefined
            ? { filtres: normalizeIndicateurVueFilters(filtres) }
            : {}),
        },
        context.user.id,
        context.tx
      );
      return vue ? success(toIndicateurVue(vue)) : failure('NOT_FOUND');
    } catch (error) {
      return failure('DATABASE_ERROR', error as Error);
    }
  }

  async delete(
    input: DeleteIndicateurVueInput,
    context: ServiceSecondArg
  ): Promise<Result<void, IndicateurVuesError>> {
    try {
      const authorized = await this.getAuthorizedVue(input, context);
      if (!authorized.success) return authorized;

      const deleted = await this.repository.delete(
        { id: input.id, collectiviteId: authorized.data.collectiviteId },
        context.tx
      );
      return deleted ? success(undefined) : failure('NOT_FOUND');
    } catch (error) {
      return failure('DATABASE_ERROR', error as Error);
    }
  }

  private async getAuthorizedVue(
    { id, collectiviteId }: DeleteIndicateurVueInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<IndicateurVueRow, IndicateurVuesError>> {
    const vue = await this.repository.getById(id, tx);
    if (!vue) return failure('NOT_FOUND');

    const permission = await this.permissions.isAllowed(
      user,
      'indicateurs.vues.mutate',
      ResourceType.COLLECTIVITE,
      { collectiviteId: vue.collectiviteId },
      tx
    );
    if (!permission.success) return failure('UNAUTHORIZED');
    if (vue.collectiviteId !== collectiviteId) return failure('NOT_FOUND');
    return success(vue);
  }
}
