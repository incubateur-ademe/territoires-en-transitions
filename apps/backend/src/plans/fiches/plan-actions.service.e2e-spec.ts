import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import PlanActionsService from '@tet/backend/plans/fiches/plan-actions.service';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';

describe('PlanActionsService', () => {
  let db: DatabaseService;
  let app: INestApplication;
  let planService: PlanActionsService;
  let user: AuthenticatedUser;
  let collectivite: Collectivite;
  let planId: number;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    planService = app.get(PlanActionsService);
    const router = await getTestRouter(app);

    // Collectivité et utilisateur isolés
    const testResult = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = testResult.collectivite;
    user = getAuthUserFromUserCredentials(testResult.user);

    // Crée un plan pour la collectivité
    const caller = router.createCaller({ user });
    const plan = await caller.plans.plans.create({
      nom: 'Plan test soft-delete',
      collectiviteId: collectivite.id,
    });
    planId = plan.id;
  });

  it("n'inclut pas les fiches supprimées (soft delete) dans le plan", async () => {
    // insère une fiche marquée comme supprimée et l'associe au plan
    const [ficheDeleted] = await db.db
      .insert(ficheActionTable)
      .values({
        collectiviteId: collectivite.id,
        titre: 'Fiche supprimée (export)',
        restreint: false,
        deleted: true,
      })
      .returning();

    await db.db
      .insert(ficheActionAxeTable)
      .values({ ficheId: ficheDeleted.id, axeId: planId } as any);

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionAxeTable)
        .where(eq(ficheActionAxeTable.ficheId, ficheDeleted.id));
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, ficheDeleted.id));
      await app.close();
    });

    const plan = await planService.getPlan(
      { collectiviteId: collectivite.id, planId },
      user
    );
    const hasDeleted = plan.rows.some((r) => r.fiche?.id === ficheDeleted.id);
    expect(hasDeleted).toBe(false);
  });
});
