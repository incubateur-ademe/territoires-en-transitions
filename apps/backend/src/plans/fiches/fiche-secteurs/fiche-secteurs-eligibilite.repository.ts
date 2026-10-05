import { Injectable } from '@nestjs/common';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { demarchePlanActionTable } from '@tet/backend/demarches/shared/models/demarche-plan-action.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { DemarcheTypeEnum, PCAET_PLAN_TYPE_KEY } from '@tet/domain/demarches';
import {
  and,
  asc,
  eq,
  exists,
  gt,
  isNull,
  notExists,
  or,
  sql,
} from 'drizzle-orm';
import { alias, AnyPgColumn } from 'drizzle-orm/pg-core';
import { axeTable } from '../shared/models/axe.table';
import { ficheActionAxeTable } from '../shared/models/fiche-action-axe.table';
import { ficheActionTable } from '../shared/models/fiche-action.table';
import { planActionTypeTable } from '../shared/models/plan-action-type.table';
import { ficheActionSecteurAttributionTable } from './fiche-action-secteur-attribution.table';

@Injectable()
export class FicheSecteursEligibiliteRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async isFicheConcernee(ficheId: number, tx?: Transaction): Promise<boolean> {
    const db = tx ?? this.databaseService.db;
    const [row] = await db
      .select({ ficheId: ficheActionTable.id })
      .from(ficheActionTable)
      .where(and(eq(ficheActionTable.id, ficheId), this.isConcernee(db)))
      .limit(1);
    return row !== undefined;
  }

  async listFichesConcerneesSansAttribution(
    {
      afterFicheId,
      limit,
      collectiviteId,
    }: { afterFicheId: number; limit: number; collectiviteId?: number },
    tx?: Transaction
  ): Promise<number[]> {
    const db = tx ?? this.databaseService.db;
    const parentTable = alias(ficheActionTable, 'parent');
    const rows = await db
      .select({ ficheId: ficheActionTable.id })
      .from(ficheActionTable)
      .where(
        and(
          gt(ficheActionTable.id, afterFicheId),
          eq(ficheActionTable.deleted, false),
          or(
            isNull(ficheActionTable.parentId),
            exists(
              db
                .select({ id: parentTable.id })
                .from(parentTable)
                .where(
                  and(
                    eq(parentTable.id, ficheActionTable.parentId),
                    eq(parentTable.deleted, false)
                  )
                )
            )
          ),
          collectiviteId === undefined
            ? undefined
            : eq(ficheActionTable.collectiviteId, collectiviteId),
          notExists(
            db
              .select({ ficheId: ficheActionSecteurAttributionTable.ficheId })
              .from(ficheActionSecteurAttributionTable)
              .where(
                eq(
                  ficheActionSecteurAttributionTable.ficheId,
                  ficheActionTable.id
                )
              )
          ),
          this.isConcernee(db)
        )
      )
      .orderBy(asc(ficheActionTable.id))
      .limit(limit);
    return rows.map(({ ficheId }) => ficheId);
  }

  /**
   * Concernée si un de ses plans est de type PCAET ou lié à une démarche PCAET,
   * quel que soit son statut : un plan lié peut être d'un autre type.
   * Une sous-action, sans axe, suit sa fiche parente.
   */
  private isConcernee(db: Transaction | DatabaseService['db']) {
    const planTable = alias(axeTable, 'plan');

    return exists(
      db
        .select({ axeId: ficheActionAxeTable.axeId })
        .from(ficheActionAxeTable)
        .innerJoin(axeTable, eq(axeTable.id, ficheActionAxeTable.axeId))
        // plan racine : l'axe porte son plan, ou il est lui-même le plan
        .innerJoin(
          planTable,
          eq(planTable.id, sql`coalesce(${axeTable.plan}, ${axeTable.id})`)
        )
        .where(
          and(
            eq(
              ficheActionAxeTable.ficheId,
              sql`coalesce(${ficheActionTable.parentId}, ${ficheActionTable.id})`
            ),
            this.isPlanConcerne(db, planTable)
          )
        )
    );
  }

  isPlanConcerne(
    db: Transaction | DatabaseService['db'],
    planTable: { id: AnyPgColumn; typeId: AnyPgColumn }
  ) {
    return or(
      exists(
        db
          .select({ id: planActionTypeTable.id })
          .from(planActionTypeTable)
          .where(
            and(
              eq(planActionTypeTable.id, planTable.typeId),
              eq(planActionTypeTable.categorie, PCAET_PLAN_TYPE_KEY.categorie),
              eq(planActionTypeTable.type, PCAET_PLAN_TYPE_KEY.type)
            )
          )
      ),
      exists(
        db
          .select({ id: demarcheTable.id })
          .from(demarchePlanActionTable)
          .innerJoin(
            demarcheTable,
            eq(demarcheTable.id, demarchePlanActionTable.demarcheId)
          )
          .where(
            and(
              eq(demarchePlanActionTable.planActionId, planTable.id),
              eq(demarcheTable.type, DemarcheTypeEnum.PCAET)
            )
          )
      )
    );
  }
}
