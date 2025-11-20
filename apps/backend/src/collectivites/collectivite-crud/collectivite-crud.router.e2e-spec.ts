import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { RoleUpdateService } from '@tet/backend/users/authorizations/roles/role-update.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { inferProcedureInput } from '@trpc/server';
import { eq } from 'drizzle-orm';

type upsertInput = inferProcedureInput<
  AppRouter['collectivites']['collectivites']['upsert']
>;

const sirenEPCI = '255600793';

describe('Test upsert collectivite', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let databaseService: DatabaseService;
  let roleUpdateService: RoleUpdateService;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
    const app = await getTestApp();
    databaseService = await getTestDatabase(app);
    roleUpdateService = app.get(RoleUpdateService);
  });

  test('Test utilisateur non support', async () => {
    await roleUpdateService.setIsSupport(yoloDodoUser.id, false);
    const caller = router.createCaller({ user: yoloDodoUser });
    const input: upsertInput = {
      type: collectiviteTypeEnum.EPCI,
      siren: sirenEPCI,
    };
    await expect(() =>
      caller.collectivites.collectivites.upsert(input)
    ).rejects.toThrowError();

    await expect(() =>
      caller.collectivites.collectivites.getAdditionalInformation(input)
    ).rejects.toThrowError();
  });

  test('Test upsert', async () => {
    await roleUpdateService.setIsSupport(yoloDodoUser.id, true);
    const caller = router.createCaller({ user: yoloDodoUser });
    const input: upsertInput = {
      type: collectiviteTypeEnum.EPCI,
      siren: sirenEPCI,
      nom: 'Test',
    };
    // Test insert
    const insert = await caller.collectivites.collectivites.upsert(input);
    expect(insert.id).not.toBeNull();
    expect(insert.nom).toEqual('Test');
    // Test update
    insert.nom = 'Test2';
    const update = await caller.collectivites.collectivites.upsert(insert);
    expect(update.id).toEqual(insert.id);
    expect(update.nom).toEqual('Test2');
    // Test insert an existing collectivité
    const colError: upsertInput = { ...update, id: undefined };
    await expect(() =>
      caller.collectivites.collectivites.upsert(colError)
    ).rejects.toThrowError(
      `La collectivité Test2 existe déjà sous l'identifiant ${insert.id}`
    );

    onTestFinished(async () => {
      try {
        await roleUpdateService.setIsSupport(yoloDodoUser.id, false);
        const [col] = await databaseService.db
          .select({ id: collectiviteTable.id })
          .from(collectiviteTable)
          .where(eq(collectiviteTable.siren, sirenEPCI));
        await databaseService.db
          .delete(collectiviteBucketTable)
          .where(eq(collectiviteBucketTable.collectiviteId, col.id));
        await databaseService.db
          .delete(collectiviteTable)
          .where(eq(collectiviteTable.id, col.id));
      } catch (error) {
        console.error('Erreur lors de la remise à zéro des données.', error);
      }
    });
  });

  describe('Test getAdditionalInformation', async () => {
    test('EPCI', async () => {
      await roleUpdateService.setIsSupport(yoloDodoUser.id, true);
      const caller = router.createCaller({ user: yoloDodoUser });
      const input: upsertInput = {
        type: collectiviteTypeEnum.EPCI,
        siren: sirenEPCI,
      };
      const result =
        await caller.collectivites.collectivites.getAdditionalInformation(
          input
        );
      expect(result).toEqual({
        type: collectiviteTypeEnum.EPCI,
        siren: sirenEPCI,
        nom: 'Syndicat de la vallée du Blavet',
        regionCode: '53',
        departementCode: '56',
        natureInsee: 'SMF',
        population: 176457,
      });
      onTestFinished(async () => {
        try {
          await roleUpdateService.setIsSupport(yoloDodoUser.id, false);
        } catch (error) {
          console.error('Erreur lors de la remise à zéro des données.', error);
        }
      });
    });

    test('Commune', async () => {
      await roleUpdateService.setIsSupport(yoloDodoUser.id, true);
      const caller = router.createCaller({ user: yoloDodoUser });
      const input: upsertInput = {
        type: collectiviteTypeEnum.COMMUNE,
        communeCode: '01001',
      };
      const result =
        await caller.collectivites.collectivites.getAdditionalInformation(
          input
        );
      expect(result).toEqual({
        type: collectiviteTypeEnum.COMMUNE,
        communeCode: '01001',
        nom: "L' Abergement-Clémenciat",
        regionCode: '84',
        departementCode: '01',
        population: 798,
      });
      onTestFinished(async () => {
        try {
          await roleUpdateService.setIsSupport(yoloDodoUser.id, false);
        } catch (error) {
          console.error('Erreur lors de la remise à zéro des données.', error);
        }
      });
    });

    test('Département', async () => {
      await roleUpdateService.setIsSupport(yoloDodoUser.id, true);
      const caller = router.createCaller({ user: yoloDodoUser });
      const input: upsertInput = {
        type: collectiviteTypeEnum.DEPARTEMENT,
        departementCode: '31',
      };
      const result =
        await caller.collectivites.collectivites.getAdditionalInformation(
          input
        );
      expect(result).toEqual({
        type: collectiviteTypeEnum.DEPARTEMENT,
        departementCode: '31',
        nom: 'Haute-Garonne',
        regionCode: '76',
        population: 1423290,
      });
      onTestFinished(async () => {
        try {
          await roleUpdateService.setIsSupport(yoloDodoUser.id, false);
        } catch (error) {
          console.error('Erreur lors de la remise à zéro des données.', error);
        }
      });
    });

    test('Region', async () => {
      await roleUpdateService.setIsSupport(yoloDodoUser.id, true);
      const caller = router.createCaller({ user: yoloDodoUser });
      const input: upsertInput = {
        type: collectiviteTypeEnum.REGION,
        regionCode: '76',
      };
      const result =
        await caller.collectivites.collectivites.getAdditionalInformation(
          input
        );
      expect(result).toEqual({
        type: collectiviteTypeEnum.REGION,
        regionCode: '76',
        nom: 'Occitanie',
        population: 6057827,
      });
      onTestFinished(async () => {
        try {
          await roleUpdateService.setIsSupport(yoloDodoUser.id, false);
        } catch (error) {
          console.error('Erreur lors de la remise à zéro des données.', error);
        }
      });
    });
  });
});
