import { INestApplication } from '@nestjs/common';
import {
  addTestCollectiviteAndUser,
  addTestCollectiviteAndUsers,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { withOnTestFinished } from '@tet/backend/utils/test-fixture.utils';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { DatabaseService } from '../../../utils/database/database.service';
import { AppRouter, TrpcRouter } from '../../../utils/trpc/trpc.router';

type ListInput = inferProcedureInput<
  AppRouter['collectivites']['membres']['list']
>;

describe('CollectiviteMembresRouter list', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let collectiviteId: number;
  let adminUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    databaseService = await getTestDatabase(app);

    const result = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectiviteId = result.collectivite.id;
    adminUser = getAuthUserFromUserCredentials(result.user);

    return async () => {
      await result.cleanup();
      await app.close();
    };
  });

  test('peut lister les membres de la collectivité', async () => {
    const caller = router.createCaller({ user: adminUser });

    const input: ListInput = {
      collectiviteId,
    };

    const result = await caller.collectivites.membres.list(input);
    assert(result);
    expect(result.membres.length).toBeGreaterThanOrEqual(1);
    expect(result.membres.map((m) => m.userId).filter(Boolean)).toHaveLength(
      result.membres.length
    );
  });

  test("ne peut pas lister les membres si on n'est pas authentifié", async () => {
    const caller = router.createCaller({ user: null });

    const input: ListInput = {
      collectiviteId,
    };

    // `rejects` is necessary to handle exception in async function
    // See https://vitest.dev/api/expect.html#tothrowerror
    await expect(() =>
      caller.collectivites.membres.list(input)
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('peut filtrer les membres par fonction', async () => {
    const caller = router.createCaller({ user: adminUser });

    const allMembres = await caller.collectivites.membres.list({
      collectiviteId,
    });
    expect(allMembres.membres.length).toBeGreaterThanOrEqual(1);

    const membresPolitique = await caller.collectivites.membres.list({
      collectiviteId,
      fonction: 'politique',
    });
    expect(membresPolitique.membres.length).toBeLessThanOrEqual(
      allMembres.membres.length
    );
    membresPolitique.membres.forEach((m) => {
      expect(m.fonction).toBe('politique');
    });
  });

  test('peut filtrer les membres par estReferent', async () => {
    const caller = router.createCaller({ user: adminUser });

    const membresReferents = await caller.collectivites.membres.list({
      collectiviteId,
      estReferent: true,
    });
    membresReferents.membres.forEach((m) => {
      expect(m.estReferent).toBe(true);
    });

    const membresNonReferents = await caller.collectivites.membres.list({
      collectiviteId,
      estReferent: false,
    });
    membresNonReferents.membres.forEach((m) => {
      expect(m.estReferent).toBe(false);
    });
  });

  test('liste les membres par ordre alphabétique (nom, prénom) en ignorant accents et casse', async () => {
    const { collectivite, users } = await withOnTestFinished(
      addTestCollectiviteAndUsers
    )(databaseService, {
      users: [
        { prenom: 'Christelle', nom: 'Membre', role: CollectiviteRole.ADMIN },
        { prenom: 'Celine', nom: 'Membre' },
        { prenom: 'Cécile', nom: 'Membre' },
        { prenom: 'Carine', nom: 'Membre' },
      ],
    });

    const sortTestAdmin = getAuthUserFromUserCredentials(users[0]);
    const caller = router.createCaller({ user: sortTestAdmin });

    const result = await caller.collectivites.membres.list({
      collectiviteId: collectivite.id,
    });

    const prenoms = result.membres.map((m) => m.prenom);
    expect(prenoms).toEqual(['Carine', 'Cécile', 'Celine', 'Christelle']);
  });
});
