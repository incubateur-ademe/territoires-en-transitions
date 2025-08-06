import { indicateurDefinitionTable } from '@/backend/indicateurs/index-domain';
import { indicateurFixture } from '@/backend/indicateurs/shared/fixtures/indicateur.fixture';
import { indicateurPiloteTable } from '@/backend/indicateurs/shared/models/indicateur-pilote.table';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  YOLO_DODO,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { and, eq } from 'drizzle-orm';
import { describe, expect } from 'vitest';
import type { UpsertIndicateurDefinitionPiloteRequest } from './indicateurs-definitions-pilotes.request';


const collectiviteId = 2;
const indicateurId = 9999;

describe('IndicateurDefinitionPiloteRouter', () => {
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let yoloDodo: AuthenticatedUser;



  beforeAll(async () => {
    const app = await getTestApp();
    router = app.get(TrpcRouter);

    databaseService = await getTestDatabase(app);
    yoloDodo = await getAuthUser(YOLO_DODO);
    try {
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateurId));


      await databaseService.db.insert(indicateurDefinitionTable).values(indicateurFixture);
    } catch (error) {
      console.error('Error inserting indicateurDefinitionTable:', error);
    }


    return async () => {
      try {
        await databaseService.db
          .delete(indicateurDefinitionTable)
          .where(eq(indicateurDefinitionTable.id, indicateurId));
        // Clean up the indicateurPiloteTable
        await databaseService.db
          .delete(indicateurPiloteTable)
          .where(and(
            eq(indicateurPiloteTable.indicateurId, indicateurId),
            eq(indicateurPiloteTable.collectiviteId, collectiviteId),
          ));
      } catch (error) {
        console.error('Error cleaning indicateurDefinitionTable:', error);
      }

      await app.close();
    };
  });

  describe('Upsert indicateur pilote', () => {
    test('should upsert a user pilote and personne pilote to an indicateur and modified the modifiedBy field', async () => {


      const userData: UpsertIndicateurDefinitionPiloteRequest = {
        tagId: null,
        userId: yoloDodo.id
      };
      const pesonneData: UpsertIndicateurDefinitionPiloteRequest = {
        tagId: 1,
        userId: null
      };

      const caller = router.createCaller({ user: yoloDodo });


      await caller.indicateurs.definitions.indicateursPilotes.upsert({
        indicateurId,
        collectiviteId,
        indicateurPilotes: [userData, pesonneData],
      })

      const userPilotes = await caller.indicateurs.definitions.indicateursPilotes.list({
        indicateurId,
        collectiviteId
      })

      expect(userPilotes).toHaveLength(2);
      expect(userPilotes[0].nom).equal('Yolo Dodo');
      expect(userPilotes[0].userId).equal(yoloDodo.id);
      expect(userPilotes[1].nom).equal('Lou Piote');
      expect(userPilotes[1].tagId).equal(1);

      const indicateurs = await caller.indicateurs.definitions.list({
        indicateurIds: [indicateurId],
        collectiviteId,
      })

      expect(indicateurs[0]).toEqual(
        expect.objectContaining({
          id: indicateurId,
          collectiviteId,
        })
      );
      expect(indicateurs[0]?.modifiedBy?.id).toEqual(yoloDodo.id);


    });
  });
});
