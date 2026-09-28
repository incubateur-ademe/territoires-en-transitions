import { INestApplication } from '@nestjs/common';
import {
    addTestCollectivite,
    addTestCollectiviteAndUsers,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
    getAuthUserFromUserCredentials,
    getTestApp,
    getTestDatabase,
    getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
    addTestUser,
    deleteUserCollectiviteRole,
    setUserCollectiviteRole,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { indicateurVueTable } from './indicateur-vue.table';
import { CreateIndicateurVueInput } from './indicateur-vues.input';

const initialFilters = { text: 'Mobilité', estFavori: true };

describe('IndicateurVuesRouter', () => {
  let app: INestApplication;
  let database: DatabaseService;
  let router: TrpcRouter;
  const cleanups: Array<() => Promise<void>> = [];

  afterEach(async () => {
    for (const cleanup of cleanups.splice(0).reverse()) {
      await cleanup();
    }
  });

  beforeAll(async () => {
    app = await getTestApp();
    database = await getTestDatabase(app);
    router = await getTestRouter(app);
    return async () => {
      await app.close();
    };
  });

  const callerFor = (user: AuthenticatedUser) =>
    router.createCaller({ user }).indicateurs.vues;

  async function addCollectiviteWithMembers(roles: CollectiviteRole[]) {
    const { collectivite, users, cleanup } = await addTestCollectiviteAndUsers(
      database,
      {
        users: roles.map((role) => ({ role })),
      }
    );
    cleanups.push(cleanup);
    return {
      collectiviteId: collectivite.id,
      users: users.map(getAuthUserFromUserCredentials),
    };
  }

  it('persiste une sélection normalisée et la partage avec les autres membres', async () => {
    const {
      collectiviteId,
      users: [author, reader],
    } = await addCollectiviteWithMembers([
      CollectiviteRole.ADMIN,
      CollectiviteRole.LECTURE,
    ]);
    const created = await callerFor(author).create({
      collectiviteId,
      nom: '  Mobilité  ',
      filtres: {
        ...initialFilters,
        thematiqueIds: [8, 3, 8],
        serviceIds: [],
        estRempli: false,
      },
    });

    expect(created).toMatchObject({
      collectiviteId,
      nom: 'Mobilité',
      filtres: {
        ...initialFilters,
        thematiqueIds: [3, 8],
        estRempli: false,
      },
      createdBy: author.id,
      modifiedBy: author.id,
    });
    expect(created.filtres).not.toHaveProperty('serviceIds');
    expect(created.id).toEqual(expect.any(String));
    expect(created.createdAt).toMatch(/Z$/);
    expect(await callerFor(reader).list({ collectiviteId })).toEqual([created]);
  });

  it.each([
    CollectiviteRole.EDITION,
    CollectiviteRole.EDITION_FICHES_INDICATEURS,
  ])(
    'permet au rôle %s de gérer une vue créée par un autre membre',
    async (role) => {
      const {
        collectiviteId,
        users: [author, editor],
      } = await addCollectiviteWithMembers([CollectiviteRole.ADMIN, role]);
      const created = await callerFor(author).create({
        collectiviteId,
        nom: 'Mobilité',
        filtres: initialFilters,
      });
      const target = { id: created.id, collectiviteId };

      const updated = await callerFor(editor).update({
        ...target,
        filtres: { text: 'Énergie', estFavori: true },
      });
      expect(updated).toMatchObject({
        ...target,
        nom: created.nom,
        createdAt: created.createdAt,
        createdBy: author.id,
        modifiedBy: editor.id,
        filtres: { text: 'Énergie', estFavori: true },
      });
      expect((await callerFor(author).list({ collectiviteId }))[0]).toEqual(
        updated
      );

      const renamed = await callerFor(editor).update({
        ...target,
        nom: 'Énergie',
      });
      expect(renamed).toMatchObject({
        ...target,
        nom: 'Énergie',
        filtres: updated.filtres,
      });
      await callerFor(editor).delete(target);
      expect(await callerFor(author).list({ collectiviteId })).toEqual([]);
    }
  );

  it('refuse toutes les mutations à un membre en lecture', async () => {
    const {
      collectiviteId,
      users: [author, reader],
    } = await addCollectiviteWithMembers([
      CollectiviteRole.ADMIN,
      CollectiviteRole.LECTURE,
    ]);
    const input = { collectiviteId, nom: 'Mobilité', filtres: initialFilters };
    const created = await callerFor(author).create(input);
    const readerCaller = callerFor(reader);
    const target = { id: created.id, collectiviteId };

    await expect(readerCaller.create(input)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    await expect(
      readerCaller.update({ ...target, nom: 'Interdit' })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      readerCaller.update({ ...target, filtres: {} })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(readerCaller.delete(target)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    expect(await readerCaller.list({ collectiviteId })).toEqual([created]);
  });

  it('ne rend pas les vues à un visiteur vérifié', async () => {
    const { collectiviteId } = await addCollectiviteWithMembers([
      CollectiviteRole.ADMIN,
    ]);
    const { user, cleanup } = await addTestUser(database, { verified: true });
    cleanups.push(cleanup);
    const visitorCaller = callerFor(getAuthUserFromUserCredentials(user));
    await expect(visitorCaller.list({ collectiviteId })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    await expect(
      visitorCaller.create({
        collectiviteId,
        nom: 'Interdit',
        filtres: initialFilters,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('autorise les mutations sur la collectivité stockée, pas celle du payload', async () => {
    const {
      collectiviteId: firstId,
      users: [attacker],
    } = await addCollectiviteWithMembers([CollectiviteRole.ADMIN]);
    const {
      collectiviteId: secondId,
      users: [owner],
    } = await addCollectiviteWithMembers([CollectiviteRole.ADMIN]);
    const created = await callerFor(owner).create({
      collectiviteId: secondId,
      nom: 'Privée',
      filtres: initialFilters,
    });
    const attackerCaller = callerFor(attacker);

    await expect(
      attackerCaller.list({ collectiviteId: secondId })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      attackerCaller.update({
        id: created.id,
        collectiviteId: firstId,
        nom: 'Usurpée',
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      attackerCaller.delete({
        id: created.id,
        collectiviteId: firstId,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(await callerFor(owner).list({ collectiviteId: secondId })).toEqual([
      created,
    ]);
  });

  it('ne déplace pas une vue même si le membre peut écrire dans les deux collectivités', async () => {
    const {
      collectiviteId,
      users: [author],
    } = await addCollectiviteWithMembers([CollectiviteRole.ADMIN]);
    const { collectivite: other, cleanup } = await addTestCollectivite(database);
    cleanups.push(async () => {
      await deleteUserCollectiviteRole(database, {
        userId: author.id,
        collectiviteId: other.id,
      });
      await cleanup();
    });
    await setUserCollectiviteRole(database, {
      userId: author.id,
      collectiviteId: other.id,
      role: CollectiviteRole.ADMIN,
    });
    const caller = callerFor(author);
    const created = await caller.create({
      collectiviteId,
      nom: 'Mobilité',
      filtres: initialFilters,
    });

    await expect(
      caller.update({
        id: created.id,
        collectiviteId: other.id,
        filtres: {},
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      caller.delete({
        id: created.id,
        collectiviteId: other.id,
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(await caller.list({ collectiviteId })).toEqual([created]);
    expect(await caller.list({ collectiviteId: other.id })).toEqual([]);
  });

  it.each([
    { text: 'Ancienne', critereInconnu: true },
    { utilisateurPiloteIds: ['invalid-uuid'] },
  ])(
    'isole une définition invalide %j sans supprimer ses critères ou bloquer les autres vues',
    async (invalidFilters) => {
      const {
        collectiviteId,
        users: [author],
      } = await addCollectiviteWithMembers([CollectiviteRole.ADMIN]);
      const caller = callerFor(author);
      const valid = await caller.create({
        collectiviteId,
        nom: 'Valide',
        filtres: initialFilters,
      });
      const [invalid] = await database.db
        .insert(indicateurVueTable)
        .values({
          collectiviteId,
          nom: 'À corriger',
          filtres: invalidFilters,
        })
        .returning();

      const listed = await caller.list({ collectiviteId });
      expect(listed).toHaveLength(2);
      expect(listed).toContainEqual(valid);
      expect(listed.find(({ id }) => id === invalid.id)).toMatchObject({
        id: invalid.id,
        nom: 'À corriger',
        filtres: null,
      });
      await caller.update({
        id: invalid.id,
        collectiviteId,
        nom: 'Toujours invalide',
      });
      const [persisted] = await database.db
        .select()
        .from(indicateurVueTable)
        .where(eq(indicateurVueTable.id, invalid.id));
      expect(persisted.filtres).toEqual(invalidFilters);
      const repaired = await caller.update({
        id: invalid.id,
        collectiviteId,
        filtres: initialFilters,
      });
      expect(repaired.filtres).toEqual(initialFilters);
    }
  );

  it('conserve une vue après la suppression du compte de son auteur', async () => {
    const {
      collectiviteId,
      users: [reader],
    } = await addCollectiviteWithMembers([CollectiviteRole.LECTURE]);
    const { user, cleanup } = await addTestUser(database, {
      collectiviteId,
      role: CollectiviteRole.EDITION,
    });
    const author = getAuthUserFromUserCredentials(user);
    const created = await callerFor(author).create({
      collectiviteId,
      nom: 'Durable',
      filtres: initialFilters,
    });
    await cleanup();

    expect(await callerFor(reader).list({ collectiviteId })).toEqual([
      { ...created, createdBy: null, modifiedBy: null },
    ]);
  });

  it('valide le nom, les filtres et la présence de modifications avant toute écriture', async () => {
    const {
      collectiviteId,
      users: [author],
    } = await addCollectiviteWithMembers([CollectiviteRole.ADMIN]);
    const caller = callerFor(author);
    for (const invalid of [
      { nom: '   ', filtres: initialFilters },
      { nom: 'x'.repeat(101), filtres: initialFilters },
      { nom: 'Invalide', filtres: { text: 'Mobilité', unsupported: true } },
      { nom: 'Invalide', filtres: { estFavori: 'true' } },
      { nom: 'Invalide', filtres: { currentPage: 2 } },
      { nom: 'Invalide', filtres: { utilisateurPiloteIds: ['invalid-uuid'] } },
    ]) {
      await expect(
        caller.create({
          collectiviteId,
          ...invalid,
        } as CreateIndicateurVueInput)
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    }
    const created = await caller.create({
      collectiviteId,
      nom: 'Valide',
      filtres: initialFilters,
    });
    await expect(
      caller.update({ id: created.id, collectiviteId })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(
      caller.update({
        id: created.id,
        collectiviteId,
        filtres: { utilisateurPiloteIds: ['invalid-uuid'] },
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(await caller.list({ collectiviteId })).toEqual([created]);
  });

  it('permet une réinitialisation explicite des filtres sans changer le nom ou la collectivité', async () => {
    const {
      collectiviteId,
      users: [author],
    } = await addCollectiviteWithMembers([CollectiviteRole.ADMIN]);
    const caller = callerFor(author);
    const created = await caller.create({
      collectiviteId,
      nom: 'Mobilité',
      filtres: initialFilters,
    });
    const updated = await caller.update({
      id: created.id,
      collectiviteId,
      filtres: {},
    });
    expect(updated).toMatchObject({
      id: created.id,
      collectiviteId,
      nom: created.nom,
      filtres: {},
    });
  });
});
