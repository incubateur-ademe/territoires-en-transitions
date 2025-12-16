import { RouterInput } from '@tet/api';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { eq } from 'drizzle-orm';
import { partition } from 'es-toolkit';
import { testWithFiches } from 'tests/plans/fiches/fiches.fixture';
import { databaseService } from 'tests/shared/database.service';
import { FixtureFactory } from 'tests/shared/fixture-factory.interface';
import { UserFixture } from 'tests/users/users.fixture';
import { CreatePlanPom } from './create-plan/create-plan.pom';
import { EditPlanPom } from './edit-plan/edit-plan.pom';

class PlansFactory extends FixtureFactory {
  constructor() {
    super();
  }

  /**
   * Crée des plans
   */
  async create(
    user: UserFixture,
    plan: RouterInput['plans']['plans']['create']
  ): Promise<number> {
    const trpcClient = user.getTrpcClient();
    const createdPlan = await trpcClient.plans.plans.create.mutate(plan);
    console.log('Create plan', createdPlan.id);
    return createdPlan.id;
  }

  async createAxe(
    user: UserFixture,
    axe: RouterInput['plans']['plans']['createAxe']
  ): Promise<number> {
    const trpcClient = user.getTrpcClient();
    const createdAxe = await trpcClient.plans.plans.createAxe.mutate(axe);
    console.log('Create axe', createdAxe.id);
    return createdAxe.id;
  }

  /**
   * Supprime tous les plans/axes d'une collectivité
   */
  async cleanupByCollectiviteId(collectiviteId: number): Promise<void> {
    const ret = await databaseService.db
      .delete(axeTable)
      .where(eq(axeTable.collectiviteId, collectiviteId))
      .returning();
    const [plans, axes] = partition(ret, (axeOuPlan) => !axeOuPlan.parent);
    console.log(
      `${plans.length} plan(s) & ${axes.length} axe(s) removed from collectivite ${collectiviteId}`
    );
  }
}

export const testWithPlans = testWithFiches.extend<{
  plans: PlansFactory;
  createPlanPom: CreatePlanPom;
  editPlanPom: EditPlanPom;
}>({
  plans: async ({ collectivites }, use) => {
    const plans = new PlansFactory();
    collectivites.registerCleanupFunc(plans);
    await use(plans);
  },
  createPlanPom: async ({ page }, use) => {
    const createPlanPom = new CreatePlanPom(page);
    await use(createPlanPom);
  },
  editPlanPom: async ({ page }, use) => {
    const showPlanPom = new EditPlanPom(page);
    await use(showPlanPom);
  },
});
