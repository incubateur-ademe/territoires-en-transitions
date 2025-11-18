import { Injectable, Logger } from '@nestjs/common';
import { FicheWithRelations, StatutEnum } from '@tet/domain/plans';
import { roundTo } from '@tet/domain/utils';

@Injectable()
export class PlanProgressRules {
  private readonly logger = new Logger(PlanProgressRules.name);

  computeProgress(fiches: FicheWithRelations[]): number {
    if (!fiches?.length) {
      return 0;
    }
    // Will be complexified with fiche progress & subactions
    const totalFiches = fiches.filter((fiche) => !fiche.parentId).length;
    const fichesCompleted = fiches.filter(
      (fiche) => !fiche.parentId && fiche.statut === StatutEnum.REALISE
    ).length;
    return roundTo((fichesCompleted * 100) / totalFiches, 1);
  }
}
