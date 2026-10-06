import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { sql } from 'drizzle-orm';
import { PlanSecteursCounts } from './list-plan-secteurs-counts.output';
import {
  PlanFicheSecteursEtat,
  PlanFichesSecteursRepository,
} from './plan-fiches-secteurs.repository';

@Injectable()
export class ListPlanSecteursCountsRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly planFichesSecteursRepository: PlanFichesSecteursRepository
  ) {}

  async listCounts(
    { collectiviteId, planIds }: { collectiviteId: number; planIds: number[] },
    tx?: Transaction
  ): Promise<PlanSecteursCounts[]> {
    const planFiches = this.planFichesSecteursRepository.listPlanFiches(
      { collectiviteId, planIds },
      tx
    );
    const countFiches = (etat: PlanFicheSecteursEtat) =>
      sql<number>`count(distinct ${planFiches.ficheId}) filter (where ${planFiches.etat} = ${etat})`.mapWith(
        Number
      );

    return (tx ?? this.databaseService.db)
      .select({
        planId: planFiches.planId,
        enCoursDeCalcul: countFiches('en_cours_de_calcul'),
        aRenseigner: countFiches('a_renseigner'),
        nonAttribuables: countFiches('non_attribuable'),
      })
      .from(planFiches)
      .groupBy(planFiches.planId);
  }
}
