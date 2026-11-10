import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result, success } from '@tet/backend/utils/result.type';
import { FicheWithRelations, PlanNode, StatutEnum } from '@tet/domain/plans';
import { GetPlanError } from '../../get-plan/get-plan.errors';
import { PlanProgressRules } from '../../progress/plan-progress.rules';
import { ListSuiviPlanFichesService } from '../list-suivi-plan-fiches.service';
import { SuiviPlanBlocInput } from '../suivi-plan.input';

export type AvancementAxe = {
  id: number;
  nom: string | null;
  avancement: number;
  total: number;
  realisees: number;
  sousAxes: AvancementAxe[];
};

@Injectable()
export class GetAvancementParAxeService {
  constructor(
    private readonly listSuiviPlanFichesService: ListSuiviPlanFichesService,
    private readonly planProgressRules: PlanProgressRules
  ) {}

  async getAvancementParAxe(
    input: SuiviPlanBlocInput,
    context: ServiceSecondArg
  ): Promise<Result<AvancementAxe[], GetPlanError>> {
    const result = await this.listSuiviPlanFichesService.listFiches(
      input,
      context
    );
    if (!result.success) {
      return result;
    }
    const { plan, fiches } = result.data;
    const fichesById = new Map(fiches.map((fiche) => [fiche.id, fiche]));

    const buildAxe = (
      axe: PlanNode
    ): { axe: AvancementAxe; ficheIds: Set<number> } => {
      const sousAxes = plan.axes
        .filter((node) => node.parent === axe.id)
        .map(buildAxe);
      const ficheIds = new Set([
        ...axe.fiches,
        ...sousAxes.flatMap((sousAxe) => [...sousAxe.ficheIds]),
      ]);
      const axeFiches = [...ficheIds]
        .map((ficheId) => fichesById.get(ficheId))
        .filter((fiche): fiche is FicheWithRelations => fiche !== undefined);

      return {
        ficheIds,
        axe: {
          id: axe.id,
          nom: axe.nom,
          avancement: this.planProgressRules.computeProgress(axeFiches),
          total: axeFiches.length,
          realisees: axeFiches.filter(
            (fiche) => fiche.statut === StatutEnum.REALISE
          ).length,
          sousAxes: sousAxes.map((sousAxe) => sousAxe.axe),
        },
      };
    };

    return success(
      plan.axes
        .filter((node) => node.parent === plan.id)
        .map((node) => buildAxe(node).axe)
    );
  }
}
