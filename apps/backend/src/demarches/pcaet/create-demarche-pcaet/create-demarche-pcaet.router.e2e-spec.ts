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
import {
  DEMARCHE_PCAET_DEFAULT_TITRE,
  DEMARCHE_PCAET_INITIAL_STATUS,
} from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';

describe('Créer une démarche PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let noAccessUser: AuthenticatedUser;

  // Une seule démarche « en cours » par collectivité : chaque test qui crée
  // travaille sur sa propre collectivité fraîche.
  const freshEditor = async () => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const user = getAuthUserFromUserCredentials(fixture.user);
    return {
      collectivite: fixture.collectivite,
      user,
      caller: router.createCaller({ user }),
    };
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const collectiviteAndUser = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    collectivite = collectiviteAndUser.collectivite;
    editorUser = getAuthUserFromUserCredentials(collectiviteAndUser.user);

    const noAccessUserResult = await addTestUser(db);
    noAccessUser = getAuthUserFromUserCredentials(noAccessUserResult.user);

    return async () => {
      await app.close();
    };
  });

  test('Créer une démarche avec les valeurs par défaut', async () => {
    const caller = router.createCaller({ user: editorUser });

    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    expect(demarche.id).toBeGreaterThan(0);
    expect(demarche.collectiviteId).toBe(collectivite.id);
    expect(demarche.titre).toBe(DEMARCHE_PCAET_DEFAULT_TITRE);
    expect(demarche.status).toBe(DEMARCHE_PCAET_INITIAL_STATUS);
    expect(demarche.obligation).toBe('obligatoire');
    expect(demarche.pilotes).toEqual([]);
    expect(demarche.planActionId).toBeNull();
  });

  test('Créer une démarche avec un titre, une date de lancement et un pilote utilisateur', async () => {
    const {
      caller,
      collectivite: localCollectivite,
      user,
    } = await freshEditor();

    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: localCollectivite.id,
      titre: 'PCAET réglementaire 2026',
      launchedAt: '2022-01-01T00:00:00.000Z',
      pilotes: [{ userId: user.id, tagId: null }],
    });

    expect(demarche.titre).toBe('PCAET réglementaire 2026');
    expect(demarche.launchedAt).toBeTruthy();
    expect(demarche.pilotes).toHaveLength(1);
    expect(demarche.pilotes[0].userId).toBe(user.id);
    expect(demarche.pilotes[0].nom).not.toBe('');
  });

  test('Refuser une seconde démarche tant qu’une démarche est en cours', async () => {
    const { caller, collectivite: localCollectivite } = await freshEditor();

    const premiere = await caller.demarches.pcaet.create({
      collectiviteId: localCollectivite.id,
    });

    await expect(
      caller.demarches.pcaet.create({ collectiviteId: localCollectivite.id })
    ).rejects.toThrow(
      'Une démarche PCAET est déjà en cours pour cette collectivité'
    );

    // Une fois adoptée, la démarche n'est plus « en cours » : nouveau dépôt possible.
    await db.db
      .update(demarcheTable)
      .set({ status: 'adopte' })
      .where(eq(demarcheTable.id, premiere.id));

    const seconde = await caller.demarches.pcaet.create({
      collectiviteId: localCollectivite.id,
    });
    expect(seconde.id).not.toBe(premiere.id);
  });

  test('Refuser la création à un utilisateur sans accès à la collectivité', async () => {
    const caller = router.createCaller({ user: noAccessUser });

    await expect(
      caller.demarches.pcaet.create({ collectiviteId: collectivite.id })
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
  });
});
