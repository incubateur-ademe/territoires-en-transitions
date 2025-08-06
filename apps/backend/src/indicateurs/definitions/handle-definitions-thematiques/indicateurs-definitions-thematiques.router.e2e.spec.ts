import { indicateurDefinitionTable } from '@/backend/indicateurs/index-domain';
import { indicateurThematiqueTable } from '@/backend/indicateurs/shared/models/indicateur-thematique.table';
import { thematiqueTable } from '@/backend/shared/index-domain';
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
import { indicateurFixture } from '../../shared/fixtures/indicateur.fixture';
import { thematique1, thematique2, thematique3 } from '../../shared/fixtures/thematique.fixture';


const collectiviteId = 2;
const indicateurId = 9999;

describe('IndicateurDefinitionThematiqueRouter', () => {
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

      // clean and insert thematiques
      await databaseService.db
        .delete(thematiqueTable)
        .where(eq(thematiqueTable.id, thematique1.id));
      await databaseService.db
        .delete(thematiqueTable)
        .where(eq(thematiqueTable.id, thematique2.id));
      await databaseService.db
        .delete(thematiqueTable)
        .where(eq(thematiqueTable.id, thematique3.id));
      await databaseService.db.insert(thematiqueTable).values(thematique1);
      await databaseService.db.insert(thematiqueTable).values(thematique2);
      await databaseService.db.insert(thematiqueTable).values(thematique3);

      // clean and insert indicateur thematique
      await databaseService.db
        .delete(indicateurThematiqueTable)
        .where(eq(indicateurThematiqueTable.indicateurId, indicateurId));
      await databaseService.db.insert(indicateurThematiqueTable).values({
        indicateurId,
        thematiqueId: thematique1.id,
      });
      await databaseService.db.insert(indicateurThematiqueTable).values({
        indicateurId,
        thematiqueId: thematique2.id,
      });

    } catch (error) {
      console.error('Error inserting indicateurDefinitionTable:', error);
    }


    return async () => {
      try {
        // clean up the indicateurDefinitionTable
        await databaseService.db
          .delete(indicateurDefinitionTable)
          .where(eq(indicateurDefinitionTable.id, indicateurId));
        // clean up thematiques
        await databaseService.db
          .delete(thematiqueTable)
          .where(eq(thematiqueTable.id, thematique1.id));
        await databaseService.db
          .delete(thematiqueTable)
          .where(eq(thematiqueTable.id, thematique2.id));
        await databaseService.db
          .delete(thematiqueTable)
          .where(eq(thematiqueTable.id, thematique3.id));

        // clean up indicateur thematique
        await databaseService.db
          .delete(indicateurThematiqueTable)
          .where(eq(indicateurThematiqueTable.indicateurId, indicateurId));
      } catch (error) {
        console.error('Error cleaning indicateurDefinitionTable:', error);
      }

      await app.close();
    };
  });

  describe('List indicateur thematique', () => {
    test('should list all thematiques associated with an indicateur', async () => {


      const caller = router.createCaller({ user: yoloDodo });

      const serviceThematiques = await caller.indicateurs.definitions.indicateursThematiques.list({
        indicateurId,
        collectiviteId,
      })

      expect(serviceThematiques).toHaveLength(2);
      expect(serviceThematiques[0].id).equal(thematique1.id);
      expect(serviceThematiques[1].id).equal(thematique2.id);

    });
  });

  describe('Upsert indicateur service thematique', () => {
    test('should upsert a service thematique associated with an indicateur and a collectivite and modified the modifiedBy field', async () => {


      const caller = router.createCaller({ user: yoloDodo });

      await caller.indicateurs.definitions.indicateursThematiques.upsert({
        indicateurId,
        collectiviteId,
        indicateurThematiqueIds: [thematique1.id, thematique3.id],
      })


      const serviceThematiques = await caller.indicateurs.definitions.indicateursThematiques.list({
        indicateurId,
        collectiviteId,
      });

      expect(serviceThematiques).toHaveLength(2);
      expect(serviceThematiques[0].id).equal(thematique1.id);
      expect(serviceThematiques[1].id).equal(thematique3.id);

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
