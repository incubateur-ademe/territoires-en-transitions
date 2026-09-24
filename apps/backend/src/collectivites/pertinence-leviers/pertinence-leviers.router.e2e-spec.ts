import { INestApplication, NotFoundException } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
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
import { PertinenceLevier } from '@tet/domain/collectivites';
import { categorieActionEnumValues, LevierId } from '@tet/domain/shared';
import { CollectiviteRole } from '@tet/domain/users';
import { sql } from 'drizzle-orm';
import { sortBy } from 'es-toolkit';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';
import { UpsertPertinenceLevierInput } from './upsert-pertinence-levier/upsert-pertinence-levier.input';

type PertinenceLeviersCaller = ReturnType<
  TrpcRouter['createCaller']
>['collectivites']['pertinenceLeviers'];

type CollectiviteWithUser = {
  collectiviteId: number;
  user: AuthenticatedUser;
};

describe('PertinenceLeviersRouter', { timeout: 30_000 }, () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;

  const callerFor = (user: AuthenticatedUser): PertinenceLeviersCaller =>
    router.createCaller({ user }).collectivites.pertinenceLeviers;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    return async (): Promise<void> => {
      await app.close();
    };
  });

  const addCollectiviteWithMember = async (
    role: CollectiviteRole
  ): Promise<CollectiviteWithUser> => {
    const { collectivite, user, cleanup } = await addTestCollectiviteAndUser(
      db,
      { user: { role } }
    );
    onTestFinished(cleanup);
    return {
      collectiviteId: collectivite.id,
      user: getAuthUserFromUserCredentials(user),
    };
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

  const listSortedPertinences = async (
    user: AuthenticatedUser,
    collectiviteId: number
  ): Promise<PertinenceLevier[]> => {
    const { pertinences } = await callerFor(user).list({
      collectiviteId,
      enjeu: 'ges',
    });
    return sortBy(pertinences, [
      ({ levierId }) => levierId,
      ({ categorie }) => categorie ?? '',
    ]);
  };

  const qualifyLevierWithAllCategories = async ({
    admin,
    collectiviteId,
    levierId,
  }: {
    admin: AuthenticatedUser;
    collectiviteId: number;
    levierId: LevierId;
  }): Promise<void> => {
    await callerFor(admin).upsert({
      collectiviteId,
      enjeu: 'ges',
      levierId,
      pertinence: 'pertinent',
    });
    await Promise.all(
      categorieActionEnumValues.map((categorie) =>
        callerFor(admin).upsert({
          collectiviteId,
          enjeu: 'ges',
          levierId,
          categorie,
          pertinence: 'a_discuter',
        })
      )
    );
  };

  const toQualifiedCategories = (levierId: LevierId): PertinenceLevier[] =>
    categorieActionEnumValues
      .toSorted()
      .map((categorie) => ({ levierId, categorie, pertinence: 'a_discuter' }));

  it('rend la pertinence posée par un admin sur un levier puis sur une de ses catégories', async () => {
    const { collectiviteId, user: admin } = await addCollectiviteWithMember(
      CollectiviteRole.ADMIN
    );

    await callerFor(admin).upsert({
      collectiviteId,
      enjeu: 'ges',
      levierId: 'biogaz',
      pertinence: 'a_discuter',
    });
    await callerFor(admin).upsert({
      collectiviteId,
      enjeu: 'ges',
      levierId: 'biogaz',
      categorie: 'financement',
      pertinence: 'pertinent',
    });

    expect(await listSortedPertinences(admin, collectiviteId)).toStrictEqual([
      { levierId: 'biogaz', pertinence: 'a_discuter' },
      { levierId: 'biogaz', categorie: 'financement', pertinence: 'pertinent' },
    ]);
  });

  it("enregistre l'admin appelant comme auteur de la pertinence", async () => {
    const { collectiviteId, user: admin } = await addCollectiviteWithMember(
      CollectiviteRole.ADMIN
    );

    await callerFor(admin).upsert({
      collectiviteId,
      enjeu: 'ges',
      levierId: 'biogaz',
      pertinence: 'pertinent',
    });

    const authorRows = await db.db.execute<{ modifiedBy: string | null }>(
      sql`select modified_by as "modifiedBy"
          from collectivite_levier_ges_pertinence
          where collectivite_id = ${collectiviteId}`
    );
    expect(authorRows.rows).toEqual([{ modifiedBy: admin.id }]);
  });

  it("rend les pertinences à un utilisateur vérifié qui n'est membre d'aucune collectivité", async () => {
    const { collectiviteId, user: admin } = await addCollectiviteWithMember(
      CollectiviteRole.ADMIN
    );
    const verifiedUser = await addUserWithoutCollectivite({ verified: true });
    await callerFor(admin).upsert({
      collectiviteId,
      enjeu: 'ges',
      levierId: 'covoiturage',
      pertinence: 'non_pertinent',
    });

    expect(
      await callerFor(verifiedUser).list({ collectiviteId, enjeu: 'ges' })
    ).toEqual({
      collectiviteId,
      pertinences: [{ levierId: 'covoiturage', pertinence: 'non_pertinent' }],
    });
  });

  it("refuse la qualification d'un levier à un membre en édition", async () => {
    const { collectiviteId, user: editionMember } =
      await addCollectiviteWithMember(CollectiviteRole.EDITION);

    await expect(
      callerFor(editionMember).upsert({
        collectiviteId,
        enjeu: 'ges',
        levierId: 'biogaz',
        pertinence: 'pertinent',
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it("refuse à l'admin d'une collectivité la qualification des leviers d'une autre", async () => {
    const first = await addCollectiviteWithMember(CollectiviteRole.ADMIN);
    const second = await addCollectiviteWithMember(CollectiviteRole.ADMIN);

    await expect(
      callerFor(first.user).upsert({
        collectiviteId: second.collectiviteId,
        enjeu: 'ges',
        levierId: 'biogaz',
        pertinence: 'non_pertinent',
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(
      await callerFor(second.user).list({
        collectiviteId: second.collectiviteId,
        enjeu: 'ges',
      })
    ).toEqual({ collectiviteId: second.collectiviteId, pertinences: [] });
  });

  it("rend les pertinences d'une collectivité en accès restreint à un de ses membres en lecture", async () => {
    const { collectivite, user, cleanup } = await addTestCollectiviteAndUser(
      db,
      {
        collectivite: { accesRestreint: true },
        user: { role: CollectiviteRole.LECTURE },
      }
    );
    onTestFinished(cleanup);

    expect(
      await callerFor(getAuthUserFromUserCredentials(user)).list({
        collectiviteId: collectivite.id,
        enjeu: 'ges',
      })
    ).toEqual({ collectiviteId: collectivite.id, pertinences: [] });
  });

  it('cache les pertinences à un utilisateur non vérifié', async () => {
    const { collectiviteId } = await addCollectiviteWithMember(
      CollectiviteRole.ADMIN
    );
    const unverifiedUser = await addUserWithoutCollectivite({
      verified: false,
    });

    await expect(
      callerFor(unverifiedUser).list({ collectiviteId, enjeu: 'ges' })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it("cache les pertinences d'une collectivité en accès restreint à un utilisateur vérifié qui n'en est pas membre", async () => {
    const restricted = await addTestCollectivite(db, { accesRestreint: true });
    onTestFinished(restricted.cleanup);
    const verifiedUser = await addUserWithoutCollectivite({ verified: true });

    await expect(
      callerFor(verifiedUser).list({
        collectiviteId: restricted.collectivite.id,
        enjeu: 'ges',
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it("rejette la lecture d'une collectivité qui n'existe pas avec une NotFoundException pour cause", async () => {
    const verifiedUser = await addUserWithoutCollectivite({ verified: true });

    await expect(
      callerFor(verifiedUser).list({
        collectiviteId: 999_999_999,
        enjeu: 'ges',
      })
    ).rejects.toMatchObject({ cause: expect.any(NotFoundException) });
  });

  it('refuse un levier inconnu', async () => {
    const { collectiviteId, user: admin } = await addCollectiviteWithMember(
      CollectiviteRole.ADMIN
    );

    await expect(
      callerFor(admin).upsert({
        collectiviteId,
        enjeu: 'ges',
        levierId: 'levier_inconnu',
        pertinence: 'pertinent',
      } as unknown as UpsertPertinenceLevierInput)
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('refuse une catégorie inconnue', async () => {
    const { collectiviteId, user: admin } = await addCollectiviteWithMember(
      CollectiviteRole.ADMIN
    );

    await expect(
      callerFor(admin).upsert({
        collectiviteId,
        enjeu: 'ges',
        levierId: 'biogaz',
        categorie: 'categorie_inconnue',
        pertinence: 'pertinent',
      } as unknown as UpsertPertinenceLevierInput)
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('efface la pertinence des six catégories quand leur levier devient non pertinent', async () => {
    const { collectiviteId, user: admin } = await addCollectiviteWithMember(
      CollectiviteRole.ADMIN
    );
    await qualifyLevierWithAllCategories({
      admin,
      collectiviteId,
      levierId: 'biogaz',
    });
    await qualifyLevierWithAllCategories({
      admin,
      collectiviteId,
      levierId: 'covoiturage',
    });

    await callerFor(admin).upsert({
      collectiviteId,
      enjeu: 'ges',
      levierId: 'biogaz',
      pertinence: 'non_pertinent',
    });

    expect(await listSortedPertinences(admin, collectiviteId)).toStrictEqual([
      { levierId: 'biogaz', pertinence: 'non_pertinent' },
      { levierId: 'covoiturage', pertinence: 'pertinent' },
      ...toQualifiedCategories('covoiturage'),
    ]);
  });

  it('laisse intactes les catégories du même levier dans une autre collectivité', async () => {
    const first = await addCollectiviteWithMember(CollectiviteRole.ADMIN);
    const second = await addCollectiviteWithMember(CollectiviteRole.ADMIN);
    await qualifyLevierWithAllCategories({
      admin: first.user,
      collectiviteId: first.collectiviteId,
      levierId: 'biogaz',
    });
    await qualifyLevierWithAllCategories({
      admin: second.user,
      collectiviteId: second.collectiviteId,
      levierId: 'biogaz',
    });

    await callerFor(first.user).upsert({
      collectiviteId: first.collectiviteId,
      enjeu: 'ges',
      levierId: 'biogaz',
      pertinence: 'non_pertinent',
    });

    expect({
      first: await listSortedPertinences(first.user, first.collectiviteId),
      second: await listSortedPertinences(second.user, second.collectiviteId),
    }).toStrictEqual({
      first: [{ levierId: 'biogaz', pertinence: 'non_pertinent' }],
      second: [
        { levierId: 'biogaz', pertinence: 'pertinent' },
        ...toQualifiedCategories('biogaz'),
      ],
    });
  });

  it("accepte la qualification d'une catégorie dont le levier est non pertinent dans une autre collectivité", async () => {
    const first = await addCollectiviteWithMember(CollectiviteRole.ADMIN);
    const second = await addCollectiviteWithMember(CollectiviteRole.ADMIN);
    await callerFor(first.user).upsert({
      collectiviteId: first.collectiviteId,
      enjeu: 'ges',
      levierId: 'biogaz',
      pertinence: 'non_pertinent',
    });

    await callerFor(second.user).upsert({
      collectiviteId: second.collectiviteId,
      enjeu: 'ges',
      levierId: 'biogaz',
      categorie: 'financement',
      pertinence: 'pertinent',
    });

    expect(
      await listSortedPertinences(second.user, second.collectiviteId)
    ).toStrictEqual([
      { levierId: 'biogaz', categorie: 'financement', pertinence: 'pertinent' },
    ]);
  });

  it("accepte la qualification d'une catégorie quand les autres catégories du levier sont non pertinentes", async () => {
    const { collectiviteId, user: admin } = await addCollectiviteWithMember(
      CollectiviteRole.ADMIN
    );
    const otherCategories = categorieActionEnumValues.filter(
      (categorie) => categorie !== 'amenagement'
    );
    await Promise.all(
      otherCategories.map((categorie) =>
        callerFor(admin).upsert({
          collectiviteId,
          enjeu: 'ges',
          levierId: 'biogaz',
          categorie,
          pertinence: 'non_pertinent',
        })
      )
    );

    await callerFor(admin).upsert({
      collectiviteId,
      enjeu: 'ges',
      levierId: 'biogaz',
      categorie: 'amenagement',
      pertinence: 'pertinent',
    });

    expect(await listSortedPertinences(admin, collectiviteId)).toContainEqual({
      levierId: 'biogaz',
      categorie: 'amenagement',
      pertinence: 'pertinent',
    });
  });

  it.each(['a_discuter', 'pertinent'] as const)(
    'garde la pertinence des six catégories quand leur levier devient %s',
    async (levierPertinence) => {
      const { collectiviteId, user: admin } = await addCollectiviteWithMember(
        CollectiviteRole.ADMIN
      );
      await qualifyLevierWithAllCategories({
        admin,
        collectiviteId,
        levierId: 'biogaz',
      });

      await callerFor(admin).upsert({
        collectiviteId,
        enjeu: 'ges',
        levierId: 'biogaz',
        pertinence: levierPertinence,
      });

      expect(await listSortedPertinences(admin, collectiviteId)).toStrictEqual([
        { levierId: 'biogaz', pertinence: levierPertinence },
        ...toQualifiedCategories('biogaz'),
      ]);
    }
  );

  it("refuse la qualification d'une catégorie sous un levier non pertinent", async () => {
    const { collectiviteId, user: admin } = await addCollectiviteWithMember(
      CollectiviteRole.ADMIN
    );
    await callerFor(admin).upsert({
      collectiviteId,
      enjeu: 'ges',
      levierId: 'biogaz',
      pertinence: 'non_pertinent',
    });

    await expect(
      callerFor(admin).upsert({
        collectiviteId,
        enjeu: 'ges',
        levierId: 'biogaz',
        categorie: 'financement',
        pertinence: 'pertinent',
      })
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(await listSortedPertinences(admin, collectiviteId)).toStrictEqual([
      { levierId: 'biogaz', pertinence: 'non_pertinent' },
    ]);
  });

  it("ne rend à une collectivité que ses pertinences, pas celles d'une autre", async () => {
    const first = await addCollectiviteWithMember(CollectiviteRole.ADMIN);
    const second = await addCollectiviteWithMember(CollectiviteRole.ADMIN);
    await callerFor(first.user).upsert({
      collectiviteId: first.collectiviteId,
      enjeu: 'ges',
      levierId: 'biogaz',
      pertinence: 'pertinent',
    });
    await callerFor(second.user).upsert({
      collectiviteId: second.collectiviteId,
      enjeu: 'ges',
      levierId: 'covoiturage',
      pertinence: 'non_pertinent',
    });

    expect({
      first: await callerFor(first.user).list({
        collectiviteId: first.collectiviteId,
        enjeu: 'ges',
      }),
      second: await callerFor(second.user).list({
        collectiviteId: second.collectiviteId,
        enjeu: 'ges',
      }),
    }).toEqual({
      first: {
        collectiviteId: first.collectiviteId,
        pertinences: [{ levierId: 'biogaz', pertinence: 'pertinent' }],
      },
      second: {
        collectiviteId: second.collectiviteId,
        pertinences: [{ levierId: 'covoiturage', pertinence: 'non_pertinent' }],
      },
    });
  });
});
