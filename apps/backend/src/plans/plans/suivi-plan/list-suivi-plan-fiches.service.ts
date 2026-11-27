import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import {
  combineResults,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import {
  FicheWithRelations,
  ListFichesRequestFilters,
  Plan,
} from '@tet/domain/plans';
import FicheActionPermissionsService from '../../fiches/fiche-action-permissions.service';
import ListFichesService from '../../fiches/list-fiches/list-fiches.service';
import { GetPlanService } from '../get-plan/get-plan.service';
import { GetPlanError } from '../get-plan/get-plan.errors';
import { SuiviPlanBlocInput } from './suivi-plan.input';
import { withSousAxes } from './with-sous-axes';

@Injectable()
export class ListSuiviPlanFichesService {
  constructor(
    private readonly getPlanService: GetPlanService,
    private readonly listFichesService: ListFichesService,
    private readonly fichePermissionsService: FicheActionPermissionsService
  ) {}

  async listFiches(
    input: SuiviPlanBlocInput,
    { user, tx }: ServiceSecondArg
  ): Promise<
    Result<{ plan: Plan; fiches: FicheWithRelations[] }, GetPlanError>
  > {
    const contextResult = await this.getPlanAndFilters(input, { user, tx });
    if (!contextResult.success) {
      return contextResult;
    }
    const { plan, filters } = contextResult.data;

    const fichesResult = await this.listFichesService.listFichesQuery(
      {
        collectiviteId: plan.collectiviteId,
        filters,
        queryOptions: { limit: 'all' },
      },
      { tx }
    );
    if (!fichesResult.success) {
      return fichesResult;
    }

    return success({ plan, fiches: fichesResult.data.data });
  }

  async countFiches<Key extends string>(
    input: SuiviPlanBlocInput,
    filtersByKey: Record<Key, ListFichesRequestFilters>,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<Record<Key, number>, GetPlanError>> {
    const contextResult = await this.getPlanAndFilters(input, { user, tx });
    if (!contextResult.success) {
      return contextResult;
    }
    const { plan, filters } = contextResult.data;

    const keys = Object.keys(filtersByKey) as Key[];
    const countResults = await Promise.all(
      keys.map((key) =>
        this.listFichesService.listFichesQuery(
          {
            collectiviteId: plan.collectiviteId,
            filters: { ...filtersByKey[key], ...filters },
            queryOptions: { page: 1, limit: 1 },
          },
          { tx }
        )
      )
    );
    const countsResult = combineResults(countResults);
    if (!countsResult.success) {
      return countsResult;
    }

    return success(
      Object.fromEntries(
        keys.map((key, index) => [key, countsResult.data[index].count])
      ) as Record<Key, number>
    );
  }

  private async getPlanAndFilters(
    { planId, thematiqueIds, axeIds, filters }: SuiviPlanBlocInput,
    { user, tx }: ServiceSecondArg
  ): Promise<
    Result<{ plan: Plan; filters: ListFichesRequestFilters }, GetPlanError>
  > {
    const planResult = await this.getPlanService.getPlan(
      { planId },
      { user, tx }
    );
    if (!planResult.success) {
      return planResult;
    }
    const plan = planResult.data;

    const canReadFichesRestreintes =
      await this.fichePermissionsService.hasReadFichePermission(
        { collectiviteId: plan.collectiviteId, restreint: true },
        user,
        true,
        tx
      );

    return success({
      plan,
      filters: {
        ...filters,
        planActionIds: [planId],
        thematiqueIds: thematiqueIds?.length ? thematiqueIds : undefined,
        axesId: axeIds?.length ? withSousAxes(plan, axeIds) : undefined,
        restreint: canReadFichesRestreintes ? undefined : false,
      },
    });
  }
}
