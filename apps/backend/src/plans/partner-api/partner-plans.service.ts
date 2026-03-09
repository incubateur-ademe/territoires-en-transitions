import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { and, asc, count, countDistinct, eq, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { axeTable } from '../fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '../fiches/shared/models/fiche-action-axe.table';
import { ficheActionTable } from '../fiches/shared/models/fiche-action.table';
import { planActionTypeTable } from '../fiches/shared/models/plan-action-type.table';

export type AxeTreeNode = {
  id: number;
  nom: string | null;
  axes: AxeTreeNode[];
  ficheIds: number[];
};

@Injectable()
export class PartnerPlansService {
  constructor(private readonly databaseService: DatabaseService) {}

  async listPlans(collectiviteId: number) {
    const db = this.databaseService.db;

    // Plans are root axes (parent IS NULL)
    const plans = await db
      .select({
        id: axeTable.id,
        nom: axeTable.nom,
        collectiviteId: axeTable.collectiviteId,
        typeId: axeTable.typeId,
        createdAt: axeTable.createdAt,
        modifiedAt: axeTable.modifiedAt,
      })
      .from(axeTable)
      .where(
        and(
          eq(axeTable.collectiviteId, collectiviteId),
          isNull(axeTable.parent)
        )
      )
      .orderBy(asc(axeTable.nom), asc(axeTable.id));

    if (plans.length === 0) {
      return { plans: [] };
    }

    const planIds = plans.map((p) => p.id);

    // Get plan types
    const typeIds = plans
      .map((p) => p.typeId)
      .filter((id): id is number => id !== null);
    const types =
      typeIds.length > 0
        ? await db
            .select({
              id: planActionTypeTable.id,
              type: planActionTypeTable.type,
              categorie: planActionTypeTable.categorie,
            })
            .from(planActionTypeTable)
            .where(inArray(planActionTypeTable.id, typeIds))
        : [];

    const typeMap = new Map(types.map((t) => [t.id, t]));

    // Count axes per plan (excluding the root axe itself)
    const axeCountsResult = await db
      .select({
        planId: axeTable.plan,
        nbAxes: count(axeTable.id),
      })
      .from(axeTable)
      .where(
        and(inArray(axeTable.plan, planIds), isNotNull(axeTable.parent))
      )
      .groupBy(axeTable.plan);

    const axeCountMap = new Map(
      axeCountsResult.map((r) => [r.planId, Number(r.nbAxes)])
    );

    // Count non-restricted fiches per plan
    const ficheCountsResult = await db
      .select({
        planId:
          sql<number>`COALESCE(${axeTable.plan}, ${axeTable.id})`.as(
            'plan_id'
          ),
        nbFiches: countDistinct(ficheActionTable.id),
      })
      .from(ficheActionAxeTable)
      .innerJoin(axeTable, eq(axeTable.id, ficheActionAxeTable.axeId))
      .innerJoin(
        ficheActionTable,
        eq(ficheActionTable.id, ficheActionAxeTable.ficheId)
      )
      .where(
        and(
          or(inArray(axeTable.plan, planIds), inArray(axeTable.id, planIds)),
          eq(ficheActionTable.restreint, false),
          eq(ficheActionTable.deleted, false)
        )
      )
      .groupBy(sql`COALESCE(${axeTable.plan}, ${axeTable.id})`);

    const ficheCountMap = new Map(
      ficheCountsResult.map((r) => [r.planId, Number(r.nbFiches)])
    );

    return {
      plans: plans.map((plan) => ({
        id: plan.id,
        nom: plan.nom,
        type: plan.typeId ? typeMap.get(plan.typeId) ?? null : null,
        collectiviteId: plan.collectiviteId,
        nbAxes: axeCountMap.get(plan.id) ?? 0,
        nbFiches: ficheCountMap.get(plan.id) ?? 0,
        createdAt: plan.createdAt,
        modifiedAt: plan.modifiedAt,
      })),
    };
  }

  async getPlan(collectiviteId: number, planId: number) {
    const db = this.databaseService.db;

    // Get the root plan axe
    const [plan] = await db
      .select({
        id: axeTable.id,
        nom: axeTable.nom,
        collectiviteId: axeTable.collectiviteId,
        typeId: axeTable.typeId,
        createdAt: axeTable.createdAt,
        modifiedAt: axeTable.modifiedAt,
      })
      .from(axeTable)
      .where(
        and(
          eq(axeTable.id, planId),
          eq(axeTable.collectiviteId, collectiviteId),
          isNull(axeTable.parent)
        )
      )
      .limit(1);

    if (!plan) {
      throw new NotFoundException(`Plan ${planId} not found`);
    }

    // Get the plan type
    let type = null;
    if (plan.typeId) {
      const [typeResult] = await db
        .select({
          id: planActionTypeTable.id,
          type: planActionTypeTable.type,
          categorie: planActionTypeTable.categorie,
        })
        .from(planActionTypeTable)
        .where(eq(planActionTypeTable.id, plan.typeId))
        .limit(1);
      type = typeResult ?? null;
    }

    // Get all descendant axes
    const allAxes = await db
      .select({
        id: axeTable.id,
        nom: axeTable.nom,
        parent: axeTable.parent,
      })
      .from(axeTable)
      .where(
        and(
          eq(axeTable.collectiviteId, collectiviteId),
          or(eq(axeTable.plan, planId), eq(axeTable.id, planId))
        )
      )
      .orderBy(asc(axeTable.nom), asc(axeTable.id));

    // Get ficheIds per axe (only non-restricted, non-deleted)
    const axeIds = allAxes.map((a) => a.id);
    const fichesPerAxe =
      axeIds.length > 0
        ? await db
            .select({
              axeId: ficheActionAxeTable.axeId,
              ficheId: ficheActionAxeTable.ficheId,
            })
            .from(ficheActionAxeTable)
            .innerJoin(
              ficheActionTable,
              eq(ficheActionTable.id, ficheActionAxeTable.ficheId)
            )
            .where(
              and(
                inArray(ficheActionAxeTable.axeId, axeIds),
                eq(ficheActionTable.restreint, false),
                eq(ficheActionTable.deleted, false)
              )
            )
        : [];

    const ficheIdsByAxe = new Map<number, number[]>();
    for (const row of fichesPerAxe) {
      const list = ficheIdsByAxe.get(row.axeId) ?? [];
      list.push(row.ficheId);
      ficheIdsByAxe.set(row.axeId, list);
    }

    // Build tree recursively
    const childrenMap = new Map<number | null, typeof allAxes>();
    for (const axe of allAxes) {
      const parentId = axe.parent;
      const list = childrenMap.get(parentId) ?? [];
      list.push(axe);
      childrenMap.set(parentId, list);
    }

    const buildTree = (parentId: number): AxeTreeNode[] => {
      const children = childrenMap.get(parentId) ?? [];
      return children.map((child) => ({
        id: child.id,
        nom: child.nom,
        axes: buildTree(child.id),
        ficheIds: ficheIdsByAxe.get(child.id) ?? [],
      }));
    };

    return {
      id: plan.id,
      nom: plan.nom,
      type,
      collectiviteId: plan.collectiviteId,
      ficheIds: ficheIdsByAxe.get(planId) ?? [],
      axes: buildTree(planId),
      createdAt: plan.createdAt,
      modifiedAt: plan.modifiedAt,
    };
  }
}
