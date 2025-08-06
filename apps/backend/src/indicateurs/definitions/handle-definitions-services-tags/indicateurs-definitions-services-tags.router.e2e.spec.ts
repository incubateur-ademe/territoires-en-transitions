import { serviceTagTable } from '@/backend/collectivites/index-domain';
import { indicateurDefinitionTable } from '@/backend/indicateurs/index-domain';
import { indicateurPiloteTable } from '@/backend/indicateurs/shared/models/indicateur-pilote.table';
import { indicateurServiceTagTable } from '@/backend/indicateurs/shared/models/indicateur-service-tag.table';
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
import { indicateurServiceTagFixture1, indicateurServiceTagFixture2 } from '../../shared/fixtures/indicateur-service-tag.fixture';
import { indicateurFixture } from '../../shared/fixtures/indicateur.fixture';
import { serviceTagFixture1, serviceTagFixture2, serviceTagFixture3 } from '../../shared/fixtures/service-tag.fixture';


const collectiviteId = 2;
const indicateurId = 9999;

describe('IndicateurServiceTagRouter', () => {
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let yoloDodo: AuthenticatedUser;



  beforeAll(async () => {
    const app = await getTestApp();
    router = app.get(TrpcRouter);

    databaseService = await getTestDatabase(app);
    yoloDodo = await getAuthUser(YOLO_DODO);
    try {

      // clean and insert indicateur
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateurId));
      await databaseService.db.insert(indicateurDefinitionTable).values(indicateurFixture);

      // clean and insert service tags
      await databaseService.db
        .delete(serviceTagTable)
        .where(eq(serviceTagTable.collectiviteId, collectiviteId));
      await databaseService.db.insert(serviceTagTable).values(serviceTagFixture1);
      await databaseService.db.insert(serviceTagTable).values(serviceTagFixture2);
      await databaseService.db.insert(serviceTagTable).values(serviceTagFixture3);

      // clean and insert indicateur service tags
      await databaseService.db
        .delete(indicateurServiceTagTable)
        .where(and((eq(indicateurServiceTagTable.collectiviteId, collectiviteId),
          eq(indicateurServiceTagTable.indicateurId, indicateurId))));
      await databaseService.db.insert(indicateurServiceTagTable).values(indicateurServiceTagFixture1);
      await databaseService.db.insert(indicateurServiceTagTable).values(indicateurServiceTagFixture2);

    } catch (error) {
      console.error('Error inserting indicateurDefinitionTable:', error);
    }


    return async () => {
      try {
        // clean up the indicateurDefinitionTable
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
        //clean up the serviceTagTable
        await databaseService.db
          .delete(serviceTagTable)
          .where(eq(serviceTagTable.collectiviteId, collectiviteId));
      } catch (error) {
        console.error('Error cleaning indicateurDefinitionTable:', error);
      }

      await app.close();
    };
  });

  describe('List indicateur service pilote', () => {
    test('should list all service pilote associated with an indicateur and a collectivete', async () => {


      const caller = router.createCaller({ user: yoloDodo });


      const servicePilotes = await caller.indicateurs.definitions.indicateursServicesPilotes.list({
        indicateurId,
        collectiviteId,
      })

      expect(servicePilotes).toHaveLength(2);
      expect(servicePilotes[0].nom).equal('Test Service Tag 2');
      expect(servicePilotes[1].nom).equal('Test Service Tag 1');

    });
  });

  describe('Upsert indicateur service pilote', () => {
    test('should upsert a service pilote associated with an indicateur and a collectivite and modified the modifiedBy field', async () => {


      const caller = router.createCaller({ user: yoloDodo });

      await caller.indicateurs.definitions.indicateursServicesPilotes.upsert({
        indicateurId,
        collectiviteId,
        indicateurServicesPilotesIds: [serviceTagFixture3.id]
      })


      const servicePilotes = await caller.indicateurs.definitions.indicateursServicesPilotes.list({
        indicateurId,
        collectiviteId,
      })

      expect(servicePilotes).toHaveLength(1);
      expect(servicePilotes[0].nom).equal('Test Service Tag 3');

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
