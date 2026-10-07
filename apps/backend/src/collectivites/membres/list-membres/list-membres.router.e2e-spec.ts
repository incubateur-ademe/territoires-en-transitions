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
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { onTestFinished } from 'vitest';

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
  });

  afterAll(async () => {
    await app.close();
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

  /**
   * TETH-28. Un service déconcentré porte l'annuaire nominatif des
   * correspondants de l'État : adresses et téléphones lus dans `dcp`. Ces
   * coordonnées ne relèvent pas du mode visite, et la base le garantit en
   * forçant l'accès restreint sur ces collectivités — ici, il faut donc un rôle
   * sur le service, pas la seule vérification du compte.
   */
  describe('services déconcentrés (accès restreint forcé)', () => {
    const creerDreal = async () => {
      const dreal = await addTestCollectiviteAndUser(databaseService, {
        user: { role: CollectiviteRole.ADMIN },
        collectivite: {
          type: 'dreal',
          regionCode: 'S1',
          nom: 'DREAL test contacts correspondants',
        },
      });
      const visiteur = await addTestUser(databaseService);
      onTestFinished(async () => {
        await visiteur.cleanup();
        await dreal.cleanup();
      });
      return {
        collectiviteId: dreal.collectivite.id,
        membre: getAuthUserFromUserCredentials(dreal.user),
        visiteur: getAuthUserFromUserCredentials(visiteur.user),
      };
    };

    test("refuse la liste des membres d'une DREAL à un compte vérifié sans droit", async () => {
      const { collectiviteId: drealId, visiteur } = await creerDreal();

      await expect(() =>
        router
          .createCaller({ user: visiteur })
          .collectivites.membres.list({ collectiviteId: drealId })
      ).rejects.toThrowError(/collectivites\.read_confidentiel/);
    });

    test("refuse les invitations en attente d'une DREAL à un compte vérifié sans droit", async () => {
      const { collectiviteId: drealId, visiteur } = await creerDreal();

      await expect(() =>
        router
          .createCaller({ user: visiteur })
          .collectivites.membres.invitations.listPendings({
            collectiviteId: drealId,
          })
      ).rejects.toThrowError(/collectivites\.read_confidentiel/);
    });

    test('laisse un membre du service lire ses propres correspondants', async () => {
      const { collectiviteId: drealId, membre } = await creerDreal();

      const { membres } = await router
        .createCaller({ user: membre })
        .collectivites.membres.list({ collectiviteId: drealId });

      expect(membres).toHaveLength(1);
      expect(membres[0].email).toBeTruthy();
    });
  });

  /**
   * TETH-28, l'autre versant : le mode visite reste ouvert sur les
   * collectivités ordinaires, qui ne sont pas en accès restreint. Sans cette
   * garantie, la fermeture ci-dessus aurait emporté l'annuaire inter-collectivités.
   */
  test('laisse un compte vérifié sans droit lister les membres d’une collectivité ordinaire', async () => {
    const visiteur = await addTestUser(databaseService);
    onTestFinished(() => visiteur.cleanup());

    const { membres } = await router
      .createCaller({ user: getAuthUserFromUserCredentials(visiteur.user) })
      .collectivites.membres.list({ collectiviteId });

    expect(membres.length).toBeGreaterThanOrEqual(1);
  });
});
