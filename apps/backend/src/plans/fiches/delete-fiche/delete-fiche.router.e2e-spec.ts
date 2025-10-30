import { FichesRouter } from '@/backend/plans/fiches/fiches.router';
import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  YOLO_DODO,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { and, eq } from 'drizzle-orm';
import {
  describe,
  expect,
  it,
  beforeAll,
  afterAll,
  onTestFinished,
} from 'vitest';
import { ficheActionFixture } from '@/backend/plans/fiches/shared/fixtures/fiche-action.fixture';

const collectiviteId = 1;
const ficheId = ficheActionFixture.id;

describe('DeleteFicheRouter', () => {
  let db: DatabaseService;
  let router: FichesRouter;
  let yoloDodo: AuthenticatedUser;

  let app: Awaited<ReturnType<typeof getTestApp>>;
  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(FichesRouter);
    db = await getTestDatabase(app);
    yoloDodo = await getAuthUser(YOLO_DODO);
  });

  afterAll(async () => {
    await app.close();
  });

  it('marque la fiche comme étant supprimée (soft delete)', async () => {
    const caller = router.createCaller({ user: yoloDodo });
    await db.db.insert(ficheActionTable).values({
      ...ficheActionFixture,
      collectiviteId,
      titre: 'Fiche à supprimer',
    });

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, ficheId));
    });

    const result = await caller.delete({ ficheId });
    expect(result).toEqual({ success: true });

    const [row] = await db.db
      .select({ id: ficheActionTable.id, deleted: ficheActionTable.deleted })
      .from(ficheActionTable)
      .where(eq(ficheActionTable.id, ficheId));
    expect(row.deleted).toBe(true);
  });

  it('Charger une fiche supprimée (soft delete) génère une erreur', async () => {
    const caller = router.createCaller({ user: yoloDodo });
    await db.db.insert(ficheActionTable).values({
      ...ficheActionFixture,
      collectiviteId,
      titre: 'Fiche à supprimer',
    });

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, ficheId));
    });

    // Soft delete avant la requête GET
    await caller.delete({ ficheId });
    await expect(() => caller.get({ id: ficheId })).rejects.toThrow(
      expect.objectContaining({
        message: `Aucune fiche action trouvée avec l'id ${ficheId}`,
      })
    );
  });

  it('listFiches n’inclut pas les fiches supprimées (soft delete)', async () => {
    const caller = router.createCaller({ user: yoloDodo });
    await db.db.insert(ficheActionTable).values({
      ...ficheActionFixture,
      id: ficheId,
      collectiviteId,
      titre: 'Fiche à supprimer',
    });

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, ficheId));
    });

    // vérifie que la fiche remonte avant le soft delete
    const { data: dataBeforeDelete } = await caller.listFiches({
      collectiviteId,
      filters: {},
      queryOptions: { page: 1, limit: 50 },
    });
    expect(dataBeforeDelete.find((f) => f.id === ficheId)).toBeDefined();

    // Soft delete
    await caller.delete({ ficheId });
    const { data: dataAfterDelete } = await caller.listFiches({
      collectiviteId,
      filters: {},
      queryOptions: { page: 1, limit: 50 },
    });

    // vérifie que la fiche ne remonte plus après le soft delete
    expect(dataAfterDelete.find((f) => f.id === ficheId)).toBeUndefined();

    // vérifie que la base contient toujours ligne
    const exists = await db.db
      .select({ id: ficheActionTable.id })
      .from(ficheActionTable)
      .where(
        and(
          eq(ficheActionTable.id, ficheId),
          eq(ficheActionTable.deleted, true)
        )
      );
    expect(exists.length).toBe(1);
  });
});
