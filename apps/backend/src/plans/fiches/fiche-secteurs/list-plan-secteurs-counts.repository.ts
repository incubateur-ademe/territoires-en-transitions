import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { OrigineSecteursEnum } from '@tet/domain/plans';
import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { axeTable } from '../shared/models/axe.table';
import { ficheActionAxeTable } from '../shared/models/fiche-action-axe.table';
import { ficheActionTable } from '../shared/models/fiche-action.table';
import { ficheActionSecteurAttributionTable } from './fiche-action-secteur-attribution.table';
import { FicheSecteursEligibiliteRepository } from './fiche-secteurs-eligibilite.repository';
import { PlanSecteursCounts } from './list-plan-secteurs-counts.output';

@Injectable()
export class ListPlanSecteursCountsRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly eligibiliteRepository: FicheSecteursEligibiliteRepository
  ) {}

  async listCounts(
    { collectiviteId, planIds }: { collectiviteId: number; planIds: number[] },
    tx?: Transaction
  ): Promise<PlanSecteursCounts[]> {
    const db = tx ?? this.databaseService.db;
    const planTable = alias(axeTable, 'plan');
    const ficheRacineTable = alias(ficheActionTable, 'fiche_racine');
    const attribution = ficheActionSecteurAttributionTable;
    const ficheId = ficheActionTable.id;

    return db
      .select({
        planId: planTable.id,
        enCoursDeCalcul:
          sql<number>`count(distinct ${ficheId}) filter (where ${attribution.ficheId} is null)`.mapWith(
            Number
          ),
        aRenseigner:
          sql<number>`count(distinct ${ficheId}) filter (where ${attribution.origine} = ${OrigineSecteursEnum.INDISPONIBLE})`.mapWith(
            Number
          ),
        nonAttribuables:
          sql<number>`count(distinct ${ficheId}) filter (where ${attribution.origine} <> ${OrigineSecteursEnum.INDISPONIBLE} and cardinality(${attribution.secteurs}) = 0)`.mapWith(
            Number
          ),
      })
      .from(planTable)
      .leftJoin(
        axeTable,
        or(eq(axeTable.plan, planTable.id), eq(axeTable.id, planTable.id))
      )
      .leftJoin(ficheActionAxeTable, eq(ficheActionAxeTable.axeId, axeTable.id))
      .leftJoin(
        ficheRacineTable,
        and(
          eq(ficheRacineTable.id, ficheActionAxeTable.ficheId),
          eq(ficheRacineTable.deleted, false)
        )
      )
      .leftJoin(
        ficheActionTable,
        and(
          or(
            eq(ficheActionTable.id, ficheRacineTable.id),
            eq(ficheActionTable.parentId, ficheRacineTable.id)
          ),
          eq(ficheActionTable.deleted, false)
        )
      )
      .leftJoin(attribution, eq(attribution.ficheId, ficheId))
      .where(
        and(
          inArray(planTable.id, planIds),
          eq(planTable.collectiviteId, collectiviteId),
          isNull(planTable.parent),
          this.eligibiliteRepository.isPlanConcerne(db, planTable)
        )
      )
      .groupBy(planTable.id);
  }
}
