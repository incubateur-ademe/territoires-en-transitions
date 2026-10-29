import { Injectable } from '@nestjs/common';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  and,
  countDistinct,
  eq,
  inArray,
  isNull,
  max,
  or,
  sql,
} from 'drizzle-orm';

export type PlanActivity = {
  planId: number;
  derniereModificationFiche: string | null;
  fichesModifiees90Jours: number;
  fichesParStatut: Record<string, number>;
};

/**
 * Activité des plans, calculée en une requête par indicateur : dernière
 * modification d'une fiche et fiches modifiées sur 90 jours, statuts des
 * fiches. Sous-actions et fiches supprimées exclues, comme dans les
 * statistiques de l'équipe data. À appeler après le contrôle de droits.
 */
@Injectable()
export class ListPlansActivityRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getActivity(planIds: number[]): Promise<Map<number, PlanActivity>> {
    const activity = new Map<number, PlanActivity>(
      planIds.map((planId) => [
        planId,
        {
          planId,
          derniereModificationFiche: null,
          fichesModifiees90Jours: 0,
          fichesParStatut: {},
        },
      ])
    );
    if (planIds.length === 0) {
      return activity;
    }

    const planId = sql<number>`coalesce(${axeTable.plan}, ${axeTable.id})`;
    const fichesDesPlans = this.databaseService.db
      .select({
        planId: planId.as('plan_id'),
        ficheId: ficheActionTable.id,
        statut: ficheActionTable.statut,
        modifiedAt: ficheActionTable.modifiedAt,
      })
      .from(ficheActionAxeTable)
      .innerJoin(axeTable, eq(axeTable.id, ficheActionAxeTable.axeId))
      .innerJoin(
        ficheActionTable,
        eq(ficheActionTable.id, ficheActionAxeTable.ficheId)
      )
      .where(
        and(
          or(inArray(axeTable.id, planIds), inArray(axeTable.plan, planIds)),
          isNull(ficheActionTable.parentId),
          eq(sql`coalesce(${ficheActionTable.deleted}, false)`, false)
        )
      )
      .as('fiches_des_plans');

    const [resume, statuts] = await Promise.all([
      this.databaseService.db
        .select({
          planId: fichesDesPlans.planId,
          derniereModification: max(fichesDesPlans.modifiedAt),
          recentes: countDistinct(
            sql`case when ${fichesDesPlans.modifiedAt} >= now() - interval '90 days' then ${fichesDesPlans.ficheId} end`
          ),
        })
        .from(fichesDesPlans)
        .groupBy(fichesDesPlans.planId),
      this.databaseService.db
        .select({
          planId: fichesDesPlans.planId,
          statut: fichesDesPlans.statut,
          n: countDistinct(fichesDesPlans.ficheId),
        })
        .from(fichesDesPlans)
        .groupBy(fichesDesPlans.planId, fichesDesPlans.statut),
    ]);

    for (const row of resume) {
      const entry = activity.get(Number(row.planId));
      if (entry) {
        entry.derniereModificationFiche = row.derniereModification
          ? String(row.derniereModification)
          : null;
        entry.fichesModifiees90Jours = Number(row.recentes);
      }
    }
    for (const row of statuts) {
      const entry = activity.get(Number(row.planId));
      if (entry) {
        entry.fichesParStatut[row.statut ?? 'Sans statut'] = Number(row.n);
      }
    }
    return activity;
  }
}
