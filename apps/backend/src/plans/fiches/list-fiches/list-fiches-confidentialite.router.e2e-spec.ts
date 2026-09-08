import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

describe('listFiches et la confidentialité', () => {
  let router: TrpcRouter;
  let db: DatabaseService;
  let collectiviteId: number;
  let ficheRestreinteId: number;
  let ficheOuverteId: number;
  let membreEnLecture: AuthenticatedUser;
  let visiteurVerifie: AuthenticatedUser;

  beforeAll(async () => {
    const app: INestApplication = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const { collectivite } = await addTestCollectivite(db);
    collectiviteId = collectivite.id;

    const { user: membre } = await addTestUser(db, {
      collectiviteId,
      role: CollectiviteRole.LECTURE,
    });
    membreEnLecture = getAuthUserFromUserCredentials(membre);

    const { user: visiteur } = await addTestUser(db, {
      collectiviteId: null,
      role: CollectiviteRole.LECTURE,
    });
    visiteurVerifie = getAuthUserFromUserCredentials(visiteur);

    const fiches = await db.db
      .insert(ficheActionTable)
      .values([
        { titre: 'Fiche restreinte', restreint: true, collectiviteId },
        { titre: 'Fiche ouverte', restreint: false, collectiviteId },
      ])
      .returning();
    ficheRestreinteId = fiches[0].id;
    ficheOuverteId = fiches[1].id;

    return async () => {
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.collectiviteId, collectiviteId));
      await app.close();
    };
  });

  const listerPour = async (user: AuthenticatedUser): Promise<number[]> => {
    const { data } = await router
      .createCaller({ user })
      .plans.fiches.listFiches({ collectiviteId });
    return data.map((fiche) => fiche.id);
  };

  it('cache une fiche restreinte à un visiteur vérifié non membre', async () => {
    expect(await listerPour(visiteurVerifie)).not.toContain(ficheRestreinteId);
  });

  it('laisse une fiche non restreinte visible au visiteur vérifié', async () => {
    expect(await listerPour(visiteurVerifie)).toContain(ficheOuverteId);
  });

  it('montre la fiche restreinte à un membre en lecture', async () => {
    expect(await listerPour(membreEnLecture)).toContain(ficheRestreinteId);
  });

  it('ignore une demande explicite de fiches restreintes venant du visiteur vérifié', async () => {
    const { data } = await router
      .createCaller({ user: visiteurVerifie })
      .plans.fiches.listFiches({
        collectiviteId,
        filters: { restreint: true },
      });
    expect(data.map((fiche) => fiche.id)).toEqual([]);
  });
});
