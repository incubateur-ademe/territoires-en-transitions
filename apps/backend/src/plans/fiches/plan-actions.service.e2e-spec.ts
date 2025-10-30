import PlanActionsService from '@/backend/plans/fiches/plan-actions.service';
import { axeTable } from '@/backend/plans/fiches/shared/models/axe.table';
import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { ficheActionAxeTable } from '@/backend/plans/fiches/shared/models/fiche-action-axe.table';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  YOLO_DODO,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { describe, expect, it, beforeAll, onTestFinished } from 'vitest';

describe('PlanActionsService', () => {
  let db: DatabaseService;
  let app: INestApplication;
  let planService: PlanActionsService;
  let user: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    planService = app.get(PlanActionsService);
    user = await getAuthUser(YOLO_DODO);
  });

  it("n'inclut pas les fiches supprimées (soft delete) dans le plan", async () => {
    // récupère un axe de la collectivité pour en déduire le plan cible
    const [axe] = await db.db
      .select()
      .from(axeTable)
      .where(eq(axeTable.collectiviteId, YOLO_DODO.collectiviteId.admin));

    expect(axe).toBeDefined();

    const collectiviteId = axe.collectiviteId;
    const planId = axe.plan as number;

    // insère une fiche marquée comme supprimée et l'associe à l'axe
    const [ficheDeleted] = await db.db
      .insert(ficheActionTable)
      .values({
        collectiviteId,
        titre: 'Fiche supprimée (export)',
        restreint: false,
        deleted: true,
      })
      .returning();

    await db.db
      .insert(ficheActionAxeTable)
      .values({ ficheId: ficheDeleted.id, axeId: axe.id } as any);

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionAxeTable)
        .where(eq(ficheActionAxeTable.ficheId, ficheDeleted.id));
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, ficheDeleted.id));
      await app.close();
    });

    const plan = await planService.getPlan({ collectiviteId, planId }, user);
    const hasDeleted = plan.rows.some((r) => r.fiche?.id === ficheDeleted.id);
    expect(hasDeleted).toBe(false);
  });
});
