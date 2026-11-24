import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { QueryOptionsSchema } from '@tet/backend/plans/fiches/list-fiches/list-fiches.request';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Collectivite } from '@tet/domain/collectivites';
import {
  FicheWithRelations,
  FicheWithRelationsAndCollectivite,
  ListFichesRequestFilters,
} from '@tet/domain/plans';
import { failure, Result } from '../../../utils/result.type';
import {
  FichesRestreintesAccess,
  getDescriptionSearchScope,
  getFichesRestreintesAccess,
  maskFichesRestreintes,
} from './fiches-restreintes.rules';
import { formatFiltersForLogs } from './list-fiches-filters.repository';
import { ListFichesRepository } from './list-fiches.repository';

export type FichesReadContext = {
  user: AuthUser;
  tx?: Transaction;
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
    private readonly listFichesRepository: ListFichesRepository
  ) {}

  async getFicheById(
    ficheId: number,
    addCollectiviteData?: boolean,
    user?: AuthUser,
    tx?: Transaction
  ): Promise<
    Result<FicheWithRelations | FicheWithRelationsAndCollectivite, string>
  > {
    this.logger.log(`Récupération de la fiche action ${ficheId}`);

    const { data: fichesAction } = await this.listFichesQuery(
      null,
      {
        ficheIds: [ficheId],
        withChildren: true,
      },
      undefined,
      tx
    );

    const ficheAction = fichesAction?.find((f) => f.id === ficheId);
    if (!ficheAction) {
      return {
        success: false,
        error: `Aucune action trouvée avec l'id ${ficheId}`,
      };
    }

    if (user) {
      await this.fichePermissionService.canReadFicheObject(
        ficheAction,
        user,
        undefined,
        tx
      );
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

    return { success: true, data: ficheAction };
  }

  async countPiloteFiches(
    collectiviteId: number,
    user: AuthUser,
    subFiches = false
  ) {
    return this.listFichesRepository.countPiloteFiches(
      collectiviteId,
      user,
      subFiches
    );
  }

  async countPiloteSubFiches(collectiviteId: number, user: AuthUser) {
    return this.listFichesRepository.countPiloteSubFiches(collectiviteId, user);
  }

  async countPiloteFichesIndicateurs(collectiviteId: number, user: AuthUser) {
    return this.listFichesRepository.countPiloteFichesIndicateurs(
      collectiviteId,
      user
    );
  }

  async count(collectiviteId: number): Promise<number> {
    return this.listFichesRepository.count(collectiviteId);
  }

  async listFichesQuery(
    collectiviteId: number | null,
    filters?: ListFichesRequestFilters,
    queryOptions?: QueryOptionsSchema,
    tx?: Transaction
  ): Promise<{
    data: FicheWithRelations[];
    count: number;
  }> {
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
   * Get fiches actions resumes from the collectivity matching the given filters.
   * Also returns additional data about fetched fiches actions.
   * @param collectiviteId ID of the collectivity
   * @param filters filters to apply
   * @param queryOptions sorting, limit and pagination options
   * @return an array of summarized fiches actions with count, next page, number of pages, completion infos and data
   */
  async getFichesActionResumes(
    {
      collectiviteId,
      filters,
      queryOptions,
      readsMaskedFields,
    }: {
      collectiviteId: number;
      filters: ListFichesRequestFilters;
      queryOptions?: QueryOptionsSchema;
      readsMaskedFields: boolean;
    },
    { user, tx }: FichesReadContext
  ): Promise<{
    count: number;
    nextPage: number | null;
    nbOfPages: number;
    data: FicheWithRelations[];
  }> {
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
      return { count: 0, nextPage: null, nbOfPages: 0, data: [] };
    }

    const { data: fiches, count } =
      await this.listFichesRepository.listFichesWithDescriptionSearch({
        collectiviteId,
        filters: readable.filters,
        queryOptions,
        tx,
        descriptionSearch: getDescriptionSearchScope(readable.access),
      });
    const areFichesRestreintesReadable = readable.access === 'readable';
    const data = areFichesRestreintesReadable
      ? fiches
      : maskFichesRestreintes(fiches);

    if (queryOptions?.limit === 'all' || queryOptions === undefined) {
      return {
        count,
        nextPage: null,
        nbOfPages: 1,
        data,
      };
    }
    const { page, limit } = queryOptions;

    const nextPage = count > page * limit ? page + 1 : null;
    const nbOfPages = Math.ceil(count / limit);

    return {
      count,
      nextPage,
      nbOfPages,
      data,
    };
  }
}
