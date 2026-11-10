import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result } from '@tet/backend/utils/result.type';
import {
  FaireAvancerLePlanCompte,
  faireAvancerLePlanFilters,
} from '@tet/domain/plans';
import { GetPlanError } from '../../get-plan/get-plan.errors';
import { ListSuiviPlanFichesService } from '../list-suivi-plan-fiches.service';
import { SuiviPlanBlocInput } from '../suivi-plan.input';

export type FaireAvancerLePlan = Record<FaireAvancerLePlanCompte, number>;

@Injectable()
export class GetFaireAvancerLePlanService {
  constructor(
    private readonly listSuiviPlanFichesService: ListSuiviPlanFichesService
  ) {}

  getFaireAvancerLePlan(
    input: SuiviPlanBlocInput,
    context: ServiceSecondArg
  ): Promise<Result<FaireAvancerLePlan, GetPlanError>> {
    return this.listSuiviPlanFichesService.countFiches(
      input,
      faireAvancerLePlanFilters,
      context
    );
  }
}
