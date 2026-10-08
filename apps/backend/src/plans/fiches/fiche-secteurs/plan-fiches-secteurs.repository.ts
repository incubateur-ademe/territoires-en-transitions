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

export type PlanFicheSecteursEtat =
  | 'en_cours_de_calcul'
  | 'a_renseigner'
  | 'non_attribuable'
  | 'attribue';

@Injectable()
export class PlanFichesSecteursRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly eligibiliteRepository: FicheSecteursEligibiliteRepository
  ) {}

  listPlanFiches(
    { collectiviteId, planIds }: { collectiviteId: number; planIds: number[] },
    tx?: Transaction
  ) {
    const db = tx ?? this.databaseService.db;
    const planTable = alias(axeTable, 'plan');
    const ficheRacineTable = alias(ficheActionTable, 'fiche_racine');
    const attribution = ficheActionSecteurAttributionTable;

    return db
      .select({
        planId: sql<number>`${planTable.id}`.as('plan_id'),
        ficheId: sql<number | null>`${ficheActionTable.id}`.as('fiche_id'),
        titre: ficheActionTable.titre,
        parentId: ficheActionTable.parentId,
        restreint:
          sql<boolean>`coalesce(${ficheActionTable.restreint}, false) or coalesce(${ficheRacineTable.restreint}, false)`.as(
            'fiche_restreinte'
          ),
        etat: sql<PlanFicheSecteursEtat>`case
          when ${attribution.ficheId} is null then 'en_cours_de_calcul'
          when ${attribution.origine} = ${OrigineSecteursEnum.INDISPONIBLE} then 'a_renseigner'
          when cardinality(${attribution.secteurs}) = 0 and ${attribution.origine} <> ${OrigineSecteursEnum.MANUELLE} then 'non_attribuable'
          else 'attribue'
        end`.as('etat'),
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
      .leftJoin(attribution, eq(attribution.ficheId, ficheActionTable.id))
      .where(
        and(
          inArray(planTable.id, planIds),
          eq(planTable.collectiviteId, collectiviteId),
          isNull(planTable.parent),
          this.eligibiliteRepository.isPlanConcerne(db, planTable)
        )
      )
      .as('plan_fiche_secteurs');
  }
}
