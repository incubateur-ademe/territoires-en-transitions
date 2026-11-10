import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result, success } from '@tet/backend/utils/result.type';
import { FicheWithRelations, Plan } from '@tet/domain/plans';
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
    { planId, thematiqueIds }: SuiviPlanBlocInput,
    { user, tx }: ServiceSecondArg
  ): Promise<
    Result<{ plan: Plan; fiches: FicheWithRelations[] }, GetPlanError>
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

    const { data: fiches } = await this.listFichesService.listFichesQuery(
      plan.collectiviteId,
      {
        planActionIds: [planId],
        thematiqueIds: thematiqueIds?.length ? thematiqueIds : undefined,
        restreint: canReadFichesRestreintes ? undefined : false,
      },
      { limit: 'all' },
      tx
    );

    return success({ plan, fiches });
  }
}
