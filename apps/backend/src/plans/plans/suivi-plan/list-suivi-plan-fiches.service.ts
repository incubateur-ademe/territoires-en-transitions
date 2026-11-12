import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result, success } from '@tet/backend/utils/result.type';
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

    const { data: fiches } = await this.listFichesService.listFichesQuery(
      plan.collectiviteId,
      filters,
      { limit: 'all' },
      tx
    );

    return success({ plan, fiches });
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

    const counts = await Promise.all(
      (Object.keys(filtersByKey) as Key[]).map(async (key) => {
        const { count } = await this.listFichesService.listFichesQuery(
          plan.collectiviteId,
          { ...filtersByKey[key], ...filters },
          { page: 1, limit: 1 },
          tx
        );
        return [key, count] as const;
      })
    );

    return success(Object.fromEntries(counts) as Record<Key, number>);
  }

  private async getPlanAndFilters(
    { planId, thematiqueIds, filters }: SuiviPlanBlocInput,
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
        restreint: canReadFichesRestreintes ? undefined : false,
      },
    });
  }
}
