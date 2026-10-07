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
  let ficheRestreintNullId: number;
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
        {
          titre: 'Fiche sans confidentialité renseignée',
          restreint: null,
          collectiviteId,
        },
      ])
      .returning();
    ficheRestreinteId = fiches[0].id;
    ficheOuverteId = fiches[1].id;
    ficheRestreintNullId = fiches[2].id;

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

  it('laisse une fiche à la confidentialité non renseignée visible au visiteur vérifié', async () => {
    expect(await listerPour(visiteurVerifie)).toContain(ficheRestreintNullId);
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

  it('rend la fiche à la confidentialité non renseignée au membre qui filtre les fiches non restreintes', async () => {
    const { data } = await router
      .createCaller({ user: membreEnLecture })
      .plans.fiches.listFiches({
        collectiviteId,
        filters: { restreint: false },
      });
    expect(new Set(data.map((fiche) => fiche.id))).toEqual(
      new Set([ficheOuverteId, ficheRestreintNullId])
    );
  });
});
