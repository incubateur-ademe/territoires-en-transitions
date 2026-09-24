import { INestApplication, NotFoundException } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createFicheAndCleanupFunction } from '@tet/backend/plans/fiches/fiches.test-fixture';
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
import { type CategorieAction, type LevierId } from '@tet/domain/shared';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { sortBy } from 'es-toolkit';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';
import { collectiviteVoletGesTable } from './models/collectivite-volet-ges.table';

describe('AnalysisRouter', { timeout: 30_000 }, () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;
  let collectiviteId: number;
  let editionUser: AuthenticatedUser;
  let ficheId: number;

  const callerFor = (user: AuthenticatedUser) =>
    router.createCaller({ user }).collectivites.analysis;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    collectiviteId = collectivite.id;
    editionUser = getAuthUserFromUserCredentials(user);

    const { ficheId: createdFicheId, ficheCleanup } =
      await createFicheAndCleanupFunction({
        caller: router.createCaller({ user: editionUser }),
        ficheInput: {
          collectiviteId,
          titre: 'Amenager des pistes cyclables',
        },
      });
    ficheId = createdFicheId;

    return async () => {
      await ficheCleanup();
      await app.close();
    };
  });

  describe('getMobilisation', () => {
    const levierId: LevierId = 'velo_transport_commun';

    const insertMobilisationRows = async (
      volets: { categorie: CategorieAction; note: number }[]
    ): Promise<void> => {
      await db.db.insert(collectiviteVoletGesTable).values(
        volets.map(({ categorie, note }) => ({
          collectiviteId,
          levierId,
          categorie,
          note,
          ficheIds: [ficheId],
        }))
      );

      onTestFinished(async () => {
        await db.db
          .delete(collectiviteVoletGesTable)
          .where(eq(collectiviteVoletGesTable.collectiviteId, collectiviteId));
      });
    };

    const addUserWithoutCollectivite = async ({
      verified,
    }: {
      verified: boolean;
    }): Promise<AuthenticatedUser> => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: null,
        verified,
      });
      onTestFinished(cleanup);
      return getAuthUserFromUserCredentials(user);
    };

    it('rend une mobilisation vide sur une collectivité jamais évaluée', async () => {
      const mobilisation = await callerFor(editionUser).getMobilisation({
        collectiviteId,
        enjeu: 'ges',
      });

      expect(mobilisation).toEqual({ collectiviteId, leviers: [] });
    });

    it('compte une seule fois au levier une fiche rattachée à deux de ses catégories, sans rendre son identifiant', async () => {
      await insertMobilisationRows([
        { categorie: 'amenagement', note: 2 },
        { categorie: 'planification', note: 1 },
      ]);

      const mobilisation = await callerFor(editionUser).getMobilisation({
        collectiviteId,
        enjeu: 'ges',
      });

      expect({
        ...mobilisation,
        leviers: mobilisation.leviers.map((levier) => ({
          ...levier,
          volets: sortBy(levier.volets, ['categorie']),
        })),
      }).toStrictEqual({
        collectiviteId,
        leviers: [
          {
            levierId,
            ficheCount: 1,
            volets: [
              { categorie: 'amenagement', note: 2, ficheCount: 1 },
              { categorie: 'planification', note: 1, ficheCount: 1 },
            ],
          },
        ],
      });
    });

    it("rend la mobilisation à un utilisateur vérifié qui n'est membre d'aucune collectivité", async () => {
      await insertMobilisationRows([{ categorie: 'amenagement', note: 2 }]);
      const verifiedUser = await addUserWithoutCollectivite({ verified: true });

      const [memberView, verifiedView] = await Promise.all(
        [editionUser, verifiedUser].map((user) =>
          callerFor(user).getMobilisation({ collectiviteId, enjeu: 'ges' })
        )
      );

      expect(verifiedView).toEqual(memberView);
    });

    it('cache la mobilisation à un utilisateur non vérifié', async () => {
      await insertMobilisationRows([{ categorie: 'amenagement', note: 2 }]);
      const unverifiedUser = await addUserWithoutCollectivite({
        verified: false,
      });

      await expect(
        callerFor(unverifiedUser).getMobilisation({
          collectiviteId,
          enjeu: 'ges',
        })
      ).rejects.toThrowError(/n'existe pas/);
    });

    it("cache la mobilisation d'une collectivité en accès restreint à un utilisateur vérifié qui n'en est pas membre", async () => {
      const restricted = await addTestCollectivite(db, {
        accesRestreint: true,
      });
      onTestFinished(restricted.cleanup);
      const verifiedUser = await addUserWithoutCollectivite({ verified: true });

      await expect(
        callerFor(verifiedUser).getMobilisation({
          collectiviteId: restricted.collectivite.id,
          enjeu: 'ges',
        })
      ).rejects.toThrowError(/n'existe pas/);
    });

    it("répond introuvable à un utilisateur vérifié sur une collectivité qui n'existe pas", async () => {
      const verifiedUser = await addUserWithoutCollectivite({ verified: true });

      await expect(
        callerFor(verifiedUser).getMobilisation({
          collectiviteId: 999_999_999,
          enjeu: 'ges',
        })
      ).rejects.toMatchObject({ cause: expect.any(NotFoundException) });
    });
  });
});
