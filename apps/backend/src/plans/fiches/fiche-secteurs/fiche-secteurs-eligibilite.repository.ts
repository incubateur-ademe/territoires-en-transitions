import { Injectable } from '@nestjs/common';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { demarchePlanActionTable } from '@tet/backend/demarches/shared/models/demarche-plan-action.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { DemarcheTypeEnum, PCAET_PLAN_TYPE_KEY } from '@tet/domain/demarches';
import { and, eq, exists, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { axeTable } from '../shared/models/axe.table';
import { ficheActionAxeTable } from '../shared/models/fiche-action-axe.table';
import { ficheActionTable } from '../shared/models/fiche-action.table';
import { planActionTypeTable } from '../shared/models/plan-action-type.table';

@Injectable()
export class FicheSecteursEligibiliteRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Concernée si un de ses plans est de type PCAET ou lié à une démarche PCAET,
   * quel que soit son statut : un plan lié peut être d'un autre type.
   * Une sous-action, sans axe, suit sa fiche parente.
   */
  async isFicheConcernee(ficheId: number, tx?: Transaction): Promise<boolean> {
    const db = tx ?? this.databaseService.db;
    const planTable = alias(axeTable, 'plan');

    const isPlanPcaet = or(
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

    const [row] = await db
      .select({ ficheId: ficheActionTable.id })
      .from(ficheActionTable)
      .innerJoin(
        ficheActionAxeTable,
        eq(
          ficheActionAxeTable.ficheId,
          sql`coalesce(${ficheActionTable.parentId}, ${ficheActionTable.id})`
        )
      )
      .innerJoin(axeTable, eq(axeTable.id, ficheActionAxeTable.axeId))
      // plan racine : l'axe porte son plan, ou il est lui-même le plan
      .innerJoin(
        planTable,
        eq(planTable.id, sql`coalesce(${axeTable.plan}, ${axeTable.id})`)
      )
      .where(and(eq(ficheActionTable.id, ficheId), isPlanPcaet))
      .limit(1);

    return row !== undefined;
  }
}
