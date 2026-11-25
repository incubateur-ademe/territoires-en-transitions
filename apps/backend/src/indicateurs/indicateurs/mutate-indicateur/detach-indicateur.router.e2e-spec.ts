import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { describe, expect, onTestFinished } from 'vitest';
import { indicateurCollectiviteTable } from '../../indicateur/indicateur-collectivite.table';
import { indicateurDefinitionTable } from '../../indicateur/indicateur-definition.table';
import { indicateurValeurTable } from '../../valeurs/indicateur-valeur.table';
import { indicateurGroupeTable } from '../../shared/models/indicateur-groupe.table';
import { updateIndicateurTrpcErrorEntries } from './update-indicateur.errors';

describe('DetachIndicateurRouter', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let adminUser: AuthenticatedUser;
  let collectivite: Collectivite;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    databaseService = await getTestDatabase(app);

    const testResult = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = testResult.collectivite;
    adminUser = getAuthUserFromUserCredentials(testResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  const createAdminCaller = () => router.createCaller({ user: adminUser });

  const createParentWithSousIndicateur = async () => {
    const caller = createAdminCaller();
    const parentId = await caller.indicateurs.indicateurs.create({
      collectiviteId: collectivite.id,
      titre: 'Déchets ménagers',
      unite: 't',
    });
    await caller.indicateurs.indicateurs.update({
      collectiviteId: collectivite.id,
      indicateurId: parentId,
      indicateurFields: { totalEstCumulDesSousIndicateurs: true },
    });
    const sousIndicateurId = await caller.indicateurs.indicateurs.create({
      collectiviteId: collectivite.id,
      titre: 'Ordures ménagères',
      parentId,
    });
    return { caller, parentId, sousIndicateurId };
  };

  const createUserCaller = async (role: CollectiviteRole) => {
    const { user, cleanup } = await addTestUser(databaseService, {
      collectiviteId: collectivite.id,
      role,
    });
    onTestFinished(async () => {
      await databaseService.db
        .update(indicateurCollectiviteTable)
        .set({ modifiedBy: null })
        .where(eq(indicateurCollectiviteTable.modifiedBy, user.id));
      await cleanup();
    });
    const authUser = getAuthUserFromUserCredentials(user);
    return {
      userId: authUser.id,
      caller: router.createCaller({ user: authUser }),
    };
  };

  const setPilote = ({
    indicateurId,
    userId,
  }: {
    indicateurId: number;
    userId: string;
  }) =>
    createAdminCaller().indicateurs.indicateurs.update({
      collectiviteId: collectivite.id,
      indicateurId,
      indicateurFields: { pilotes: [{ userId }] },
    });

  const findParentId = async (indicateurId: number) => {
    const [link] = await databaseService.db
      .select({ parent: indicateurGroupeTable.parent })
      .from(indicateurGroupeTable)
      .where(eq(indicateurGroupeTable.enfant, indicateurId));
    return link?.parent ?? null;
  };

  const countSousIndicateurs = async (parentId: number) =>
    (
      await databaseService.db
        .select({ enfant: indicateurGroupeTable.enfant })
        .from(indicateurGroupeTable)
        .where(eq(indicateurGroupeTable.parent, parentId))
    ).length;

  test('dissocie le sous-indicateur de son parent pour un administrateur', async () => {
    const { caller, parentId, sousIndicateurId } =
      await createParentWithSousIndicateur();

    await caller.indicateurs.indicateurs.detach({
      collectiviteId: collectivite.id,
      indicateurId: sousIndicateurId,
    });

    expect(await findParentId(sousIndicateurId)).toBeNull();
    expect(await countSousIndicateurs(parentId)).toBe(0);
  });

  test('dissocie le sous-indicateur pour un membre en édition', async () => {
    const { parentId, sousIndicateurId } =
      await createParentWithSousIndicateur();
    const { caller: editionCaller } = await createUserCaller(
      CollectiviteRole.EDITION
    );

    await editionCaller.indicateurs.indicateurs.detach({
      collectiviteId: collectivite.id,
      indicateurId: sousIndicateurId,
    });

    expect(await countSousIndicateurs(parentId)).toBe(0);
  });

  test('dissocie le sous-indicateur pour un pilote du parent et du sous-indicateur', async () => {
    const { parentId, sousIndicateurId } =
      await createParentWithSousIndicateur();
    const { caller: piloteCaller, userId } = await createUserCaller(
      CollectiviteRole.EDITION_FICHES_INDICATEURS
    );
    await setPilote({ indicateurId: parentId, userId });
    await setPilote({ indicateurId: sousIndicateurId, userId });

    await piloteCaller.indicateurs.indicateurs.detach({
      collectiviteId: collectivite.id,
      indicateurId: sousIndicateurId,
    });

    expect(await countSousIndicateurs(parentId)).toBe(0);
  });

  test('refuse un membre en lecture', async () => {
    const { parentId, sousIndicateurId } =
      await createParentWithSousIndicateur();
    const { caller: lectureCaller } = await createUserCaller(
      CollectiviteRole.LECTURE
    );

    await expect(
      lectureCaller.indicateurs.indicateurs.detach({
        collectiviteId: collectivite.id,
        indicateurId: sousIndicateurId,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    expect(await findParentId(sousIndicateurId)).toBe(parentId);
  });

  test('refuse un pilote du seul parent', async () => {
    const { parentId, sousIndicateurId } =
      await createParentWithSousIndicateur();
    const { caller: piloteCaller, userId } = await createUserCaller(
      CollectiviteRole.EDITION_FICHES_INDICATEURS
    );
    await setPilote({ indicateurId: parentId, userId });

    await expect(
      piloteCaller.indicateurs.indicateurs.detach({
        collectiviteId: collectivite.id,
        indicateurId: sousIndicateurId,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    expect(await findParentId(sousIndicateurId)).toBe(parentId);
  });

  test('refuse un pilote du seul sous-indicateur', async () => {
    const { parentId, sousIndicateurId } =
      await createParentWithSousIndicateur();
    const { caller: piloteCaller, userId } = await createUserCaller(
      CollectiviteRole.EDITION_FICHES_INDICATEURS
    );
    await setPilote({ indicateurId: sousIndicateurId, userId });

    await expect(
      piloteCaller.indicateurs.indicateurs.detach({
        collectiviteId: collectivite.id,
        indicateurId: sousIndicateurId,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    expect(await findParentId(sousIndicateurId)).toBe(parentId);
  });

  test("refuse un indicateur qui n'est le sous-indicateur d'aucun parent", async () => {
    const { caller, parentId } = await createParentWithSousIndicateur();

    await expect(
      caller.indicateurs.indicateurs.detach({
        collectiviteId: collectivite.id,
        indicateurId: parentId,
      })
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: "L'indicateur n'est le sous-indicateur d'aucun indicateur",
    });
  });

  test('refuse une deuxième dissociation du même sous-indicateur', async () => {
    const { caller, sousIndicateurId } = await createParentWithSousIndicateur();
    await caller.indicateurs.indicateurs.detach({
      collectiviteId: collectivite.id,
      indicateurId: sousIndicateurId,
    });

    await expect(
      caller.indicateurs.indicateurs.detach({
        collectiviteId: collectivite.id,
        indicateurId: sousIndicateurId,
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test("refuse un administrateur d'une autre collectivité qui désigne la collectivité du sous-indicateur", async () => {
    const { parentId, sousIndicateurId } =
      await createParentWithSousIndicateur();
    const other = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    onTestFinished(other.cleanup);
    const otherCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(other.user),
    });

    await expect(
      otherCaller.indicateurs.indicateurs.detach({
        collectiviteId: collectivite.id,
        indicateurId: sousIndicateurId,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(await findParentId(sousIndicateurId)).toBe(parentId);
  });

  test('laisse le parent sans total après la dissociation de son dernier sous-indicateur', async () => {
    const { caller, parentId, sousIndicateurId } =
      await createParentWithSousIndicateur();
    await caller.indicateurs.valeurs.upsert({
      collectiviteId: collectivite.id,
      indicateurId: sousIndicateurId,
      dateValeur: '2022-01-01',
      resultat: 500,
    });
    await expect(
      caller.indicateurs.valeurs.totals({
        collectiviteId: collectivite.id,
        indicateurId: parentId,
      })
    ).resolves.not.toEqual([]);

    await caller.indicateurs.indicateurs.detach({
      collectiviteId: collectivite.id,
      indicateurId: sousIndicateurId,
    });

    await expect(
      caller.indicateurs.valeurs.totals({
        collectiviteId: collectivite.id,
        indicateurId: parentId,
      })
    ).resolves.toEqual([]);
  });

  test("enregistre l'auteur de la dissociation sur le parent et le sous-indicateur", async () => {
    const { parentId, sousIndicateurId } =
      await createParentWithSousIndicateur();
    const { userId, caller: editionCaller } = await createUserCaller(
      CollectiviteRole.EDITION
    );

    await editionCaller.indicateurs.indicateurs.detach({
      collectiviteId: collectivite.id,
      indicateurId: sousIndicateurId,
    });

    const modifications = await databaseService.db
      .select({
        indicateurId: indicateurCollectiviteTable.indicateurId,
        modifiedBy: indicateurCollectiviteTable.modifiedBy,
      })
      .from(indicateurCollectiviteTable)
      .where(
        and(
          eq(indicateurCollectiviteTable.collectiviteId, collectivite.id),
          inArray(indicateurCollectiviteTable.indicateurId, [
            parentId,
            sousIndicateurId,
          ])
        )
      );
    expect(modifications).toHaveLength(2);
    expect(modifications.map(({ modifiedBy }) => modifiedBy)).toEqual([
      userId,
      userId,
    ]);
  });

  test('laisse le frère lié au parent et recalcule les totaux sans le sous-indicateur dissocié', async () => {
    const { caller, parentId, sousIndicateurId } =
      await createParentWithSousIndicateur();
    const frereId = await caller.indicateurs.indicateurs.create({
      collectiviteId: collectivite.id,
      titre: 'Verre',
      parentId,
    });
    await caller.indicateurs.valeurs.upsert({
      collectiviteId: collectivite.id,
      indicateurId: sousIndicateurId,
      dateValeur: '2022-01-01',
      resultat: 500,
    });
    await caller.indicateurs.valeurs.upsert({
      collectiviteId: collectivite.id,
      indicateurId: frereId,
      dateValeur: '2022-01-01',
      resultat: 30,
    });

    await caller.indicateurs.indicateurs.detach({
      collectiviteId: collectivite.id,
      indicateurId: sousIndicateurId,
    });

    expect(await findParentId(frereId)).toBe(parentId);
    expect(await countSousIndicateurs(parentId)).toBe(1);
    const totals = await caller.indicateurs.valeurs.totals({
      collectiviteId: collectivite.id,
      indicateurId: parentId,
    });
    expect(totals).toMatchObject([
      {
        dateValeur: '2022-01-01',
        resultat: { status: 'complete', valeur: 30 },
      },
    ]);
  });

  test('signale un indicateur prédéfini comme introuvable', async () => {
    const [predefini] = await databaseService.db
      .select({ id: indicateurDefinitionTable.id })
      .from(indicateurDefinitionTable)
      .where(isNull(indicateurDefinitionTable.collectiviteId))
      .limit(1);

    await expect(
      createAdminCaller().indicateurs.indicateurs.detach({
        collectiviteId: collectivite.id,
        indicateurId: predefini.id,
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('emporte les sous-indicateurs du sous-indicateur dissocié', async () => {
    const { caller, parentId, sousIndicateurId } =
      await createParentWithSousIndicateur();
    const petitSousIndicateurId = await caller.indicateurs.indicateurs.create({
      collectiviteId: collectivite.id,
      titre: 'Verre',
      parentId: sousIndicateurId,
    });

    await caller.indicateurs.indicateurs.detach({
      collectiviteId: collectivite.id,
      indicateurId: sousIndicateurId,
    });

    expect(await findParentId(sousIndicateurId)).toBeNull();
    expect(await findParentId(petitSousIndicateurId)).toBe(sousIndicateurId);
    expect(await countSousIndicateurs(parentId)).toBe(0);
  });

  test('rend au dernier sous-indicateur dissocié son unité modifiable et laisse le parent sans sous-indicateur', async () => {
    const { caller, parentId, sousIndicateurId } =
      await createParentWithSousIndicateur();
    await expect(
      caller.indicateurs.indicateurs.update({
        collectiviteId: collectivite.id,
        indicateurId: sousIndicateurId,
        indicateurFields: { unite: 'kg' },
      })
    ).rejects.toMatchObject({
      message:
        updateIndicateurTrpcErrorEntries.SOUS_INDICATEUR_UNITE_LOCKED.message,
    });

    await caller.indicateurs.indicateurs.detach({
      collectiviteId: collectivite.id,
      indicateurId: sousIndicateurId,
    });
    await caller.indicateurs.indicateurs.update({
      collectiviteId: collectivite.id,
      indicateurId: sousIndicateurId,
      indicateurFields: { unite: 'kg' },
    });
    await caller.indicateurs.indicateurs.update({
      collectiviteId: collectivite.id,
      indicateurId: parentId,
      indicateurFields: { unite: 'm3' },
    });

    const [sousIndicateur] = await databaseService.db
      .select({ unite: indicateurDefinitionTable.unite })
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, sousIndicateurId));
    expect(sousIndicateur.unite).toBe('kg');
    expect(await countSousIndicateurs(parentId)).toBe(0);
  });

  test('conserve les valeurs du sous-indicateur dissocié', async () => {
    const { caller, sousIndicateurId } = await createParentWithSousIndicateur();
    await caller.indicateurs.valeurs.upsert({
      collectiviteId: collectivite.id,
      indicateurId: sousIndicateurId,
      dateValeur: '2022-01-01',
      resultat: 500,
      objectif: 480,
    });

    await caller.indicateurs.indicateurs.detach({
      collectiviteId: collectivite.id,
      indicateurId: sousIndicateurId,
    });

    const valeurs = await databaseService.db
      .select({
        dateValeur: indicateurValeurTable.dateValeur,
        resultat: indicateurValeurTable.resultat,
        objectif: indicateurValeurTable.objectif,
      })
      .from(indicateurValeurTable)
      .where(eq(indicateurValeurTable.indicateurId, sousIndicateurId))
      .orderBy(asc(indicateurValeurTable.dateValeur));
    expect(valeurs).toEqual([
      { dateValeur: '2022-01-01', resultat: 500, objectif: 480 },
    ]);
  });

  test("ne révèle pas un sous-indicateur d'une autre collectivité", async () => {
    const { sousIndicateurId } = await createParentWithSousIndicateur();
    const other = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    onTestFinished(other.cleanup);
    const otherCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(other.user),
    });

    await expect(
      otherCaller.indicateurs.indicateurs.detach({
        collectiviteId: other.collectivite.id,
        indicateurId: sousIndicateurId,
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(await findParentId(sousIndicateurId)).not.toBeNull();
  });
});
