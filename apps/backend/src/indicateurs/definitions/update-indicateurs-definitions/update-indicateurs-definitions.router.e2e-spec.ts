
import { UpdateIndicateurDefinitionRequest } from '@/backend/indicateurs/definitions/update-indicateurs-definitions/update-indicateurs-definitions.request';
import { indicateurDefinitionTable } from '@/backend/indicateurs/index-domain';
import { indicateurFixture, indicateurFixtureUpdated } from '@/backend/indicateurs/shared/fixtures/indicateur.fixture';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  YOLO_DODO,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { eq } from 'drizzle-orm';
import { describe, expect } from 'vitest';


const collectiviteId = 2;
const indicateurId = 9999;

describe('UpdateIndicateurDefinitionRouter', () => {
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let yoloDodo: AuthenticatedUser;



  beforeAll(async () => {
    const app = await getTestApp();
    router = app.get(TrpcRouter);

    databaseService = await getTestDatabase(app);
    yoloDodo = await getAuthUser(YOLO_DODO);
    await databaseService.db
      .delete(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId));

    await databaseService.db.insert(indicateurDefinitionTable).values(indicateurFixture);

    return async () => {

      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateurId));

      await app.close();
    };
  });

  describe('Update indicateur fields', () => {
    test('should not update indicateur when duplicate key value violates unique constraint "indicateur_definition_identifiant_referentiel_key', async () => {


      const data: UpdateIndicateurDefinitionRequest = {
        identifiantReferentiel: "cae_1.a",
        collectiviteId
      };

      const caller = router.createCaller({ user: yoloDodo });

      await expect(
        caller.indicateurs.definitions.updateIndicateur({
          indicateurId,
          indicateurFields: data,
        })
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          message: expect.stringContaining(
            `duplicate key value violates unique constraint "indicateur_definition_identifiant_referentiel_key`
          ),
        })
      );
    });
  });


  describe('Update indicateur fields', () => {
    test('should update indicateur fields', async () => {


      const data: UpdateIndicateurDefinitionRequest = {
        ...{ titre: 'New Test Indicateur', unite: 'kg' },
        collectiviteId
      };

      const updatedIndicateur = await updateIndicateur(data)

      expect(updatedIndicateur.titre).equal(
        indicateurFixtureUpdated.titre
      )
      expect(updatedIndicateur.unite).equal(
        indicateurFixtureUpdated.unite
      )
      expect(updatedIndicateur.modifiedBy).equal(
        indicateurFixtureUpdated.modifiedBy
      )
      expect(updatedIndicateur.modifiedAt).not.equal(
        indicateurFixtureUpdated.modifiedAt
      )
    });
  });

  async function updateIndicateur(data: UpdateIndicateurDefinitionRequest) {
    const caller = router.createCaller({ user: yoloDodo });

    const updatedIndicateur = await caller.indicateurs.definitions.updateIndicateur({
      indicateurId,
      indicateurFields: data,
    });

    return updatedIndicateur;
  }
});
