import { INestApplication } from '@nestjs/common';
import { getAuthUser, getTestApp, getTestRouter } from '@tet/backend/test';
import * as fs from 'node:fs';
import path from 'path';
import z from 'zod';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { addAndEnableUserSuperAdminMode } from '../../../users/users/users.test-fixture';
import { TrpcRouter } from '../../../utils/trpc/trpc.router';
import { importPlanInputSchema } from './import-plan.input';

const pathToInput = async ({
  pathName,
  collectiviteId = 1,
}: {
  pathName: string;
  collectiviteId?: number;
}): Promise<z.infer<typeof importPlanInputSchema>> => {
  const filePath = path.resolve(__dirname, pathName);
  const buff = fs.readFileSync(filePath);
  return {
    collectiviteId,
    planName: 'import test',
    planType: 1,
    file: buff.toString('base64'),
  };
};

describe("Test import Plan d'action", () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let app: INestApplication;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
    app = await getTestApp();
  });

  test('Test utilisateur non support', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const pathName = './__fixtures__/nouveau-plan-valide.xlsx';
    const input = await pathToInput({ pathName, collectiviteId: 50 });
    await expect(caller.plans.plans.import(input)).rejects.toThrowError();
  });

  test('Utilisateur support même sans droits sur la collectivité doit pouvoir importer le plan', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: yoloDodoUser.id,
    });

    onTestFinished(cleanup);

    const pathName = './__fixtures__/nouveau-plan-valide.xlsx';
    const input = await pathToInput({ pathName, collectiviteId: 50 });

    const result = await caller.plans.plans.import(input);
    expect(result).toBe(true);
  });

  test('Test import plan sans axes', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: yoloDodoUser.id,
    });
    onTestFinished(cleanup);
    const pathName = './__fixtures__/plan_sans_axes.xlsx';
    const input = await pathToInput({ pathName, collectiviteId: 50 });
    const result = await caller.plans.plans.import(input);
    expect(result).toBe(true);
  });

  test('Test import plan avec une seule fiche', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: yoloDodoUser.id,
    });
    onTestFinished(cleanup);
    const pathName = './__fixtures__/one_fiche_plan.xlsx';
    const input = await pathToInput({ pathName, collectiviteId: 50 });
    const result = await caller.plans.plans.import(input);
    expect(result).toBe(true);
  });

  test('Test erreur budget', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: yoloDodoUser.id,
    });

    onTestFinished(cleanup);

    const pathName = './__fixtures__/plan_budget_issue.xlsx';
    const input = await pathToInput({ pathName });
    await expect(caller.plans.plans.import(input)).rejects.toThrowError(
      `Erreur lors de la transformation des données :
 Colonne budget: Un nombre est attendu`
    );
  });

  test('Test erreur colonne', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: yoloDodoUser.id,
    });

    onTestFinished(cleanup);

    const pathName = './__fixtures__/plan_column_order_issue.xlsx';
    const input = await pathToInput({ pathName });
    await expect(caller.plans.plans.import(input)).rejects.toThrowError(
      `Erreur lors de la lecture du fichier Excel : La colonne B devrait être "Sous-axe (x.x)" et non "Sous-sous axe (x.x.x)"`
    );
  });
});
