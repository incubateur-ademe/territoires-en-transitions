import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result, success } from '@tet/backend/utils/result.type';
import { Statut, statutEnumValues, StatutEnum } from '@tet/domain/plans';
import { GetPlanError } from '../../get-plan/get-plan.errors';
import { PlanProgressRules } from '../../progress/plan-progress.rules';
import { ListSuiviPlanFichesService } from '../list-suivi-plan-fiches.service';
import { SuiviPlanBlocInput } from '../suivi-plan.input';

export type VueEnsemble = {
  avancement: number;
  total: number;
  abandonnees: number;
  enCoursSansAvancement: number;
  repartitionParStatut: { statut: Statut | null; count: number }[];
};

@Injectable()
export class GetVueEnsembleService {
  constructor(
    private readonly listSuiviPlanFichesService: ListSuiviPlanFichesService,
    private readonly planProgressRules: PlanProgressRules
  ) {}

  async getVueEnsemble(
    input: SuiviPlanBlocInput,
    context: ServiceSecondArg
  ): Promise<Result<VueEnsemble, GetPlanError>> {
    const result = await this.listSuiviPlanFichesService.listFiches(
      input,
      context
    );
    if (!result.success) {
      return result;
    }
    const { fiches } = result.data;

    const countStatut = (statut: Statut | null) =>
      fiches.filter((fiche) => (fiche.statut ?? null) === statut).length;

    return success({
      avancement: this.planProgressRules.computeProgress(fiches),
      total: fiches.length,
      abandonnees: countStatut(StatutEnum.ABANDONNE),
      enCoursSansAvancement: fiches.filter(
        (fiche) => fiche.statut === StatutEnum.EN_COURS && fiche.jauge === 0
      ).length,
      repartitionParStatut: [...statutEnumValues, null].map((statut) => ({
        statut,
        count: countStatut(statut),
      })),
    });
  }
}
