import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { ficheActionEtapeTable } from '@tet/backend/plans/fiches/fiche-action-etape/fiche-action-etape.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUserFromDcp,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { runMigrateEtapesToSousActions } from './migrate-etapes-to-sous-actions';

describe('migrate-etapes-to-sous-actions.e2e-spec', () => {
  let dbService: DatabaseService;

  beforeAll(async () => {
    const app = await getTestApp();
    dbService = await getTestDatabase(app);
  });

  it('migre les étapes en sous-actions et évite les doublons', async () => {
    const { collectivite, user, cleanup } = await addTestCollectiviteAndUser(
      dbService,
      { user: { accessLevel: CollectiviteRole.ADMIN } }
    );
    const authUser = getAuthUserFromDcp(user);
    const now = new Date().toISOString();

    // Crée une fiche avec 2 étapes
    const [fiche] = await dbService.db
      .insert(ficheActionTable)
      .values({
        titre: 'Fiche test migration',
        collectiviteId: collectivite.id,
        createdBy: authUser.id,
        modifiedBy: authUser.id,
        createdAt: now,
        modifiedAt: now,
      })
      .returning();

    await dbService.db.insert(ficheActionEtapeTable).values([
      {
        ficheId: fiche.id,
        nom: 'Étape terminée',
        ordre: 1,
        realise: true,
        createdBy: authUser.id,
        modifiedBy: authUser.id,
        createdAt: now,
        modifiedAt: now,
      },
      {
        ficheId: fiche.id,
        nom: 'Étape à venir',
        ordre: 2,
        realise: false,
        createdBy: authUser.id,
        modifiedBy: authUser.id,
        createdAt: now,
        modifiedAt: now,
      },
    ]);

    try {
      const result1 = await runMigrateEtapesToSousActions(dbService.db);
      expect(result1.migrated).toBe(2);
      expect(result1.skipped).toBe(0);
      expect(result1.errors).toHaveLength(0);

      const sousActions = await dbService.db
        .select()
        .from(ficheActionTable)
        .where(eq(ficheActionTable.parentId, fiche.id));

      expect(sousActions).toHaveLength(2);
      const sousActionTerminee = sousActions.find(
        (s) => s.titre === 'Étape terminée'
      );
      const sousActionAVenir = sousActions.find(
        (s) => s.titre === 'Étape à venir'
      );
      expect(sousActionTerminee?.statut).toBe('Réalisé');
      expect(sousActionAVenir?.statut).toBe('À venir');
      expect(sousActionTerminee?.createdBy).toBe(authUser.id);
      expect(sousActionTerminee?.modifiedBy).toBe(authUser.id);

      const result2 = await runMigrateEtapesToSousActions(dbService.db);
      expect(result2.migrated).toBe(0);
      expect(result2.skipped).toBe(2);
      expect(result2.errors).toHaveLength(0);
    } finally {
      await dbService.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.parentId, fiche.id));
      await dbService.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, fiche.id));
      await cleanup();
    }
  });
});
