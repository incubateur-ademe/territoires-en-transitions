import { getAuthUser, getTestApp, getTestRouter } from '@/backend/test';
import { RoleUpdateService } from '@/backend/users/authorizations/roles/role-update.service';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { AppRouter, TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { inferProcedureInput, TRPCError } from '@trpc/server';
import * as fs from 'node:fs';
import path from 'path';

type inputType = inferProcedureInput<AppRouter['plans']['fiches']['import']>;

const pathToInput = async (pathName: string): Promise<inputType> => {
  const filePath = path.resolve(__dirname, pathName);
  const buff = fs.readFileSync(filePath);
  return {
    collectiviteId: 1,
    planName: 'import test',
    planType: 1,
    file: buff.toString('base64'),
  };
};

describe("Test import Plan d'action", () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let roleUpdateService: RoleUpdateService;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
    const app = await getTestApp();
    roleUpdateService = app.get(RoleUpdateService);
  });

  test('Test utilisateur non support', async () => {
    await roleUpdateService.setIsSupport(yoloDodoUser.id, false);
    const caller = router.createCaller({ user: yoloDodoUser });
    const pathName = './__fixtures__/complex_plan.xlsx';
    const input = await pathToInput(pathName);

    await expect(() => caller.plans.fiches.import(input)).rejects.toThrow();
  });

  test('Test nouveau plan', async () => {
    await roleUpdateService.setIsSupport(yoloDodoUser.id, true);
    const caller = router.createCaller({ user: yoloDodoUser });
    const pathName = './__fixtures__/complex_plan.xlsx';
    const input = await pathToInput(pathName);

    const response = await caller.plans.fiches.import(input);
    expect(response).toBe(true);

    onTestFinished(async () => {
      try {
        await roleUpdateService.setIsSupport(yoloDodoUser.id, false);
      } catch (error) {
        console.error('Erreur lors de la remise à zéro des données.', error);
      }
    });
  });

  test('Test erreur budget', async () => {
    await roleUpdateService.setIsSupport(yoloDodoUser.id, true);
    const caller = router.createCaller({ user: yoloDodoUser });
    const pathName = './__fixtures__/plan_budget_issue.xlsx';
    const input = await pathToInput(pathName);

    let caughtError: TRPCError | undefined;
    try {
      await caller.plans.fiches.import(input);
    } catch (error) {
      caughtError = error as TRPCError;
    }

    expect(caughtError).toBeInstanceOf(TRPCError);

    expect(caughtError?.code).toBe('UNPROCESSABLE_CONTENT');

    expect(caughtError?.message).toEqual(
      'Erreur lors de la transformation des données : \n Colonne budget: Un nombre est attendu'
    );

    onTestFinished(async () => {
      try {
        await roleUpdateService.setIsSupport(yoloDodoUser.id, false);
      } catch (error) {
        console.error('Erreur lors de la remise à zéro des données.', error);
      }
    });
  });

  test('Test erreur colonne', async () => {
    await roleUpdateService.setIsSupport(yoloDodoUser.id, true);
    const caller = router.createCaller({ user: yoloDodoUser });
    const pathName = './__fixtures__/plan_column_order_issue.xlsx';
    const input = await pathToInput(pathName);

    let caughtError: TRPCError | undefined;
    try {
      await caller.plans.fiches.import(input);
    } catch (error) {
      caughtError = error as TRPCError;
    }

    expect(caughtError).toBeInstanceOf(TRPCError);

    expect(caughtError?.code).toBe('UNPROCESSABLE_CONTENT');

    expect(caughtError?.message).toEqual(
      'Erreur lors de la lecture du fichier Excel : La colonne B devrait être "Sous-axe (x.x)" et non "Sous-sous axe (x.x.x)"'
    );

    onTestFinished(async () => {
      try {
        await roleUpdateService.setIsSupport(yoloDodoUser.id, false);
      } catch (error) {
        console.error('Erreur lors de la remise à zéro des données.', error);
      }
    });
  });
});
