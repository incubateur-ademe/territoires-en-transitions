import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { QueryOptionsSchema } from '@tet/backend/plans/fiches/list-fiches/list-fiches.request';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { catchDatabaseFailure } from '@tet/backend/utils/database/catch-database-failure';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { UnsafeServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Collectivite } from '@tet/domain/collectivites';
import {
  FicheWithRelations,
  FicheWithRelationsAndCollectivite,
  ListFichesRequestFilters,
} from '@tet/domain/plans';
import { ResourceType } from '@tet/domain/users';
import { failure, Result, success } from '../../../utils/result.type';
import {
  FichesRestreintesAccess,
  getDescriptionSearchScope,
  getFichesRestreintesAccess,
  maskFichesRestreintes,
} from './fiches-restreintes.rules';
import { formatFiltersForLogs } from './list-fiches-filters.repository';
import {
  CountPiloteFichesError,
  GetFicheByIdError,
  ListFichesErrorEnum,
  ListFichesQueryError,
} from './list-fiches.errors';
import {
  ListFichesRepository,
  SousActionsMatchesCount,
} from './list-fiches.repository';

export type FichesReadContext = {
  user: AuthUser;
  tx?: Transaction;
};

export type ListFichesQueryInput = {
  collectiviteId: number | null;
  filters?: ListFichesRequestFilters;
  queryOptions?: QueryOptionsSchema;
};

export type GetFichesActionResumesInput = {
  collectiviteId: number;
  filters: ListFichesRequestFilters;
  queryOptions?: QueryOptionsSchema;
  readsMaskedFields: boolean;
};

export type FichesActionResumes = {
  count: number;
  nextPage: number | null;
  nbOfPages: number;
  data: FicheWithRelations[];
};

type ReadableFichesFilters =
  | {
      kind: 'filters';
      filters: ListFichesRequestFilters;
      access: FichesRestreintesAccess;
    }
  | { kind: 'no_readable_fiche' };

@Injectable()
export default class ListFichesService {
  private readonly logger = new Logger(ListFichesService.name);

  constructor(
    private readonly collectiviteService: CollectivitesService,
    private readonly fichePermissionService: FicheActionPermissionsService,
    private readonly permissionService: PermissionService,
    private readonly listFichesRepository: ListFichesRepository
  ) {}

  async getFicheById(
    {
      ficheId,
      addCollectiviteData = false,
    }: { ficheId: number; addCollectiviteData?: boolean },
    { user, tx }: { user?: AuthUser; tx?: Transaction } = {}
  ): Promise<
    Result<
      FicheWithRelations | FicheWithRelationsAndCollectivite,
      GetFicheByIdError
    >
  > {
    this.logger.log(`Récupération de la fiche action ${ficheId}`);

    const fichesResult = await this.listFichesQuery(
      {
        collectiviteId: null,
        filters: { ficheIds: [ficheId], withChildren: true },
      },
      { tx }
    );
    if (!fichesResult.success) {
      return fichesResult;
    }

    const ficheAction = fichesResult.data.data.find((f) => f.id === ficheId);
    if (!ficheAction) {
      return failure(
        ListFichesErrorEnum.FICHE_NOT_FOUND,
        new NotFoundException(`Aucune action trouvée avec l'id ${ficheId}`)
      );
    }

    if (user) {
      const readResult = await this.checkCanReadFiche(ficheAction, {
        user,
        tx,
      });
      if (!readResult.success) {
        return readResult;
      }
    }

    if (addCollectiviteData) {
      const collectiviteResult = await this.collectiviteService.getCollectivite(
        ficheAction.collectiviteId,
        tx
      );
      if (!collectiviteResult.success) {
        return failure(collectiviteResult.error, collectiviteResult.cause);
      }
      (ficheAction as FicheWithRelationsAndCollectivite).collectivite =
        collectiviteResult.data.collectivite as Collectivite;
    }

    return success(ficheAction);
  }

  private async checkCanReadFiche(
    fiche: FicheWithRelations,
    { user, tx }: FichesReadContext
  ): Promise<Result<void, 'UNAUTHORIZED' | 'DATABASE_ERROR'>> {
    try {
      await this.fichePermissionService.canReadFicheObject(
        fiche,
        user,
        false,
        tx
      );
      return success(undefined);
    } catch (error) {
      // Le refus arrive en ForbiddenException : on garde son message, qui
      // nomme l'utilisateur et l'autorisation manquante.
      if (error instanceof ForbiddenException) {
        return failure(ListFichesErrorEnum.UNAUTHORIZED, error);
      }
      this.logger.error(
        `Échec du contrôle de lecture de la fiche ${fiche.id}`,
        error
      );
      return failure(
        ListFichesErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async countPiloteFiches(
    collectiviteId: number,
    { user }: { user: AuthUser }
  ): Promise<Result<number, CountPiloteFichesError>> {
    return this.listFichesRepository.countPiloteFiches(collectiviteId, user);
  }

  async countPiloteSubFiches(
    collectiviteId: number,
    { user }: { user: AuthUser }
  ): Promise<Result<number, CountPiloteFichesError>> {
    return this.listFichesRepository.countPiloteFiches(
      collectiviteId,
      user,
      true
    );
  }

  async countPiloteFichesIndicateurs(
    collectiviteId: number,
    { user }: { user: AuthUser }
  ): Promise<Result<number, CountPiloteFichesError>> {
    return this.listFichesRepository.countPiloteFichesIndicateurs(
      collectiviteId,
      user
    );
  }

  async count(
    collectiviteId: number
  ): Promise<Result<number, ListFichesQueryError>> {
    return this.listFichesRepository.count(collectiviteId);
  }

  /**
   * Liste les fiches sans contrôle d'accès ni masquage des fiches restreintes :
   * c'est à l'appelant de filtrer ce que l'utilisateur peut lire.
   */
  async listFichesQuery(
    { collectiviteId, filters, queryOptions }: ListFichesQueryInput,
    { tx }: UnsafeServiceSecondArg = {}
  ): Promise<
    Result<{ data: FicheWithRelations[]; count: number }, ListFichesQueryError>
  > {
    return this.listFichesRepository.listFichesWithDescriptionSearch({
      collectiviteId,
      filters,
      queryOptions,
      tx,
      descriptionSearch: 'all',
    });
  }

  private async getReadableFichesFilters(
    {
      collectiviteId,
      filters,
      readsMaskedFields,
    }: {
      collectiviteId: number;
      filters: ListFichesRequestFilters;
      readsMaskedFields: boolean;
    },
    { user, tx }: FichesReadContext
  ): Promise<ReadableFichesFilters> {
    const canReadFichesRestreintes =
      await this.fichePermissionService.hasReadFichePermission(
        { collectiviteId, restreint: true },
        user,
        true,
        tx
      );

    const access = getFichesRestreintesAccess({
      canReadFichesRestreintes,
      filters,
      readsMaskedFields,
    });

    const areFichesRestreintesExcluded = access === 'excluded';
    if (areFichesRestreintesExcluded) {
      const isFilteringOnlyFichesRestreintes = filters.restreint === true;
      if (isFilteringOnlyFichesRestreintes) {
        return { kind: 'no_readable_fiche' };
      }
      return {
        kind: 'filters',
        filters: { ...filters, restreint: false },
        access,
      };
    }

    return { kind: 'filters', filters, access };
  }

  /**
   * Compte les sous-actions qui satisfont les filtres sur leurs propres champs
   * (K) et leurs actions parentes (M), pour le résumé « K sous-actions
   * correspondantes dans M d'entre elles » et l'état vide de la liste des
   * actions. Les fiches
   * restreintes suivent les mêmes règles que la liste.
   */
  async countSousActionsMatches(
    {
      collectiviteId,
      filters,
    }: { collectiviteId: number; filters: ListFichesRequestFilters },
    { user, tx }: FichesReadContext
  ): Promise<
    Result<
      SousActionsMatchesCount,
      ListFichesQueryError | 'UNAUTHORIZED' | 'NOT_FOUND'
    >
  > {
    return catchDatabaseFailure(async () => {
      // Droit de lecture de base sur la collectivité, indépendant des fiches
      // restreintes traitées ensuite par `getReadableFichesFilters`.
      const isPrivateResult = await this.collectiviteService.isPrivate(
        collectiviteId,
        tx
      );
      if (!isPrivateResult.success) {
        return failure(isPrivateResult.error, isPrivateResult.cause);
      }
      const permission = await this.permissionService.isAllowed(
        user,
        isPrivateResult.data ? 'plans.read_confidentiel' : 'plans.read',
        ResourceType.COLLECTIVITE,
        { collectiviteId },
        tx
      );
      if (!permission.success) {
        return failure(ListFichesErrorEnum.UNAUTHORIZED, permission.cause);
      }
      const readable = await this.getReadableFichesFilters(
        { collectiviteId, filters, readsMaskedFields: false },
        { user, tx }
      );
      if (readable.kind === 'no_readable_fiche') {
        return success({ sousActionsCount: 0, actionsCount: 0 });
      }
      return this.listFichesRepository.countSousActionsMatches({
        collectiviteId,
        filters: readable.filters,
        tx,
        descriptionSearch: getDescriptionSearchScope(readable.access),
      });
    });
  }

  /**
   * Get fiches actions resumes from the collectivity matching the given filters.
   * Also returns additional data about fetched fiches actions.
   * @param collectiviteId ID of the collectivity
   * @param filters filters to apply
   * @param queryOptions sorting, limit and pagination options
   * @return an array of summarized fiches actions with count, next page, number of pages, completion infos and data
   */
  async getFichesActionResumes(
    input: GetFichesActionResumesInput,
    context: FichesReadContext
  ): Promise<Result<FichesActionResumes, ListFichesQueryError>> {
    return catchDatabaseFailure(() =>
      this.listFichesActionResumes(input, context)
    );
  }

  private async listFichesActionResumes(
    {
      collectiviteId,
      filters,
      queryOptions,
      readsMaskedFields,
    }: GetFichesActionResumesInput,
    { user, tx }: FichesReadContext
  ): Promise<Result<FichesActionResumes, ListFichesQueryError>> {
    const filterSummary = filters ? formatFiltersForLogs(filters) : '';
    this.logger.log(
      `Récupération des fiches actions résumées pour la collectivité ${collectiviteId} ${
        filterSummary ? `(${filterSummary})` : ''
      }`
    );
    const readable = await this.getReadableFichesFilters(
      { collectiviteId, filters, readsMaskedFields },
      { user, tx }
    );
    if (readable.kind === 'no_readable_fiche') {
      return success({ count: 0, nextPage: null, nbOfPages: 0, data: [] });
    }

    const fichesResult =
      await this.listFichesRepository.listFichesWithDescriptionSearch({
        collectiviteId,
        filters: readable.filters,
        queryOptions,
        tx,
        descriptionSearch: getDescriptionSearchScope(readable.access),
      });
    if (!fichesResult.success) {
      return fichesResult;
    }
    const { data: fiches, count } = fichesResult.data;
    const areFichesRestreintesReadable = readable.access === 'readable';
    const data = areFichesRestreintesReadable
      ? fiches
      : maskFichesRestreintes(fiches);

    if (queryOptions?.limit === 'all' || queryOptions === undefined) {
      return success({
        count,
        nextPage: null,
        nbOfPages: 1,
        data,
      });
    }
    const { page, limit } = queryOptions;

    const nextPage = count > page * limit ? page + 1 : null;
    const nbOfPages = Math.ceil(count / limit);

    return success({
      count,
      nextPage,
      nbOfPages,
      data,
    });
  }
}
