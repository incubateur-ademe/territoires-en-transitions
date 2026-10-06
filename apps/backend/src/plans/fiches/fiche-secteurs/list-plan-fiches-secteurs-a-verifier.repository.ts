import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { and, asc, eq, isNotNull, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { ficheActionTable } from '../shared/models/fiche-action.table';
import { FicheSecteursAVerifier } from './list-plan-fiches-secteurs-a-verifier.output';
import { PlanFichesSecteursRepository } from './plan-fiches-secteurs.repository';

@Injectable()
export class ListPlanFichesSecteursAVerifierRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly planFichesSecteursRepository: PlanFichesSecteursRepository
  ) {}

  async listFiches(
    {
      collectiviteId,
      planId,
      includeFichesRestreintes,
    }: {
      collectiviteId: number;
      planId: number;
      includeFichesRestreintes: boolean;
    },
    tx?: Transaction
  ): Promise<FicheSecteursAVerifier[]> {
    const planFiches = this.planFichesSecteursRepository.listPlanFiches(
      { collectiviteId, planIds: [planId] },
      tx
    );

    const parentTable = alias(ficheActionTable, 'parent');

    const rows = await (tx ?? this.databaseService.db)
      .selectDistinct({
        ficheId: planFiches.ficheId,
        titre: planFiches.titre,
        parentId: planFiches.parentId,
        parentTitre: parentTable.titre,
        etat: planFiches.etat,
      })
      .from(planFiches)
      .leftJoin(parentTable, eq(parentTable.id, planFiches.parentId))
      .where(
        and(
          isNotNull(planFiches.ficheId),
          ne(planFiches.etat, 'attribue'),
          includeFichesRestreintes ? undefined : eq(planFiches.restreint, false)
        )
      )
      .orderBy(asc(planFiches.ficheId));

    return rows.flatMap(({ ficheId, etat, ...fiche }) =>
      ficheId === null || etat === 'attribue'
        ? []
        : [{ ficheId, etat, ...fiche }]
    );
  }
}
