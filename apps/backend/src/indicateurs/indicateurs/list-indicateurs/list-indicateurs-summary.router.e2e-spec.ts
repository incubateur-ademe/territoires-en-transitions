import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { onTestFinished } from 'vitest';
import { indicateurCollectiviteTable } from '../../definitions/indicateur-collectivite.table';
import { indicateurDefinitionTable } from '../../definitions/indicateur-definition.table';
import { indicateurGroupeTable } from '../../shared/models/indicateur-groupe.table';
import { indicateurPiloteTable } from '../../shared/models/indicateur-pilote.table';
import { ListIndicateursService } from './list-indicateurs.service';

describe('Chemins et compteurs des indicateurs', () => {
  let app: INestApplication;
  let database: DatabaseService;
  let router: TrpcRouter;

  beforeAll(async () => {
    app = await getTestApp();
    database = await getTestDatabase(app);
    router = app.get(TrpcRouter);
  });

  afterAll(async () => {
    await app.close();
  });

  async function createScope() {
    const { collectivite, user, cleanup } = await addTestCollectiviteAndUser(
      database,
      {
        user: { role: CollectiviteRole.ADMIN },
      }
    );
    onTestFinished(cleanup);
    const authenticatedUser = getAuthUserFromUserCredentials(user);
    return {
      collectiviteId: collectivite.id,
      user: authenticatedUser,
      caller: router.createCaller({ user: authenticatedUser }),
    };
  }

  test('retourne le chemin du parent à son enfant avec le titre court', async () => {
    const { collectiviteId, caller } = await createScope();
    const [parent, enfant] = await database.db
      .insert(indicateurDefinitionTable)
      .values([
        { collectiviteId, titre: 'Parent', unite: 'kWh' },
        {
          collectiviteId,
          titre: 'Titre complet enfant',
          titreCourt: 'Enfant',
          unite: 'kWh',
        },
      ])
      .returning();
    await database.db.insert(indicateurGroupeTable).values({
      parent: parent.id,
      enfant: enfant.id,
    });

    await expect(
      caller.indicateurs.indicateurs.getPath({
        collectiviteId,
        indicateurId: enfant.id,
      })
    ).resolves.toEqual([
      { id: parent.id, titre: 'Parent', identifiant: null },
      { id: enfant.id, titre: 'Enfant', identifiant: null },
    ]);
  });

  test('limite les compteurs à la collectivité et au pilote demandé', async () => {
    const scope = await createScope();
    const other = await createScope();
    const [favori, nonFavori, autreCollectivite] = await database.db
      .insert(indicateurDefinitionTable)
      .values([
        { collectiviteId: scope.collectiviteId, titre: 'Favori', unite: '' },
        {
          collectiviteId: scope.collectiviteId,
          titre: 'Non favori',
          unite: '',
        },
        { collectiviteId: other.collectiviteId, titre: 'Autre', unite: '' },
      ])
      .returning();
    await database.db.insert(indicateurCollectiviteTable).values([
      {
        collectiviteId: scope.collectiviteId,
        indicateurId: favori.id,
        favoris: true,
      },
      {
        collectiviteId: scope.collectiviteId,
        indicateurId: nonFavori.id,
        favoris: false,
      },
      {
        collectiviteId: other.collectiviteId,
        indicateurId: autreCollectivite.id,
        favoris: true,
      },
    ]);
    await database.db.insert(indicateurPiloteTable).values([
      {
        collectiviteId: scope.collectiviteId,
        indicateurId: favori.id,
        userId: scope.user.id,
      },
      {
        collectiviteId: scope.collectiviteId,
        indicateurId: nonFavori.id,
        userId: other.user.id,
      },
      {
        collectiviteId: other.collectiviteId,
        indicateurId: autreCollectivite.id,
        userId: scope.user.id,
      },
    ]);

    const input = { collectiviteId: scope.collectiviteId };
    await expect(
      scope.caller.indicateurs.indicateurs.getFavorisCount(input)
    ).resolves.toBe(1);
    await expect(
      scope.caller.indicateurs.indicateurs.getMesIndicateursCount(input)
    ).resolves.toBe(1);
    await expect(
      app.get(ListIndicateursService).getPersonnalisesCount(input, scope.user)
    ).resolves.toBe(2);
  });

  test('refuse un jeton sans permission de lecture, même pour un administrateur', async () => {
    const scope = await createScope();
    const input = { collectiviteId: scope.collectiviteId };
    const restrictedUser = {
      ...scope.user,
      jwtPayload: { ...scope.user.jwtPayload, permissions: [] },
    };
    const caller = router.createCaller({ user: restrictedUser });
    const [indicateur] = await database.db
      .insert(indicateurDefinitionTable)
      .values({ ...input, titre: 'Lecture interdite', unite: '' })
      .returning();

    await expect(caller.indicateurs.indicateurs.list(input)).rejects.toThrow(
      /Droits insuffisants/
    );
    await expect(
      caller.indicateurs.indicateurs.getPath({
        ...input,
        indicateurId: indicateur.id,
      })
    ).rejects.toThrow(/Droits insuffisants/);
    await expect(
      caller.indicateurs.indicateurs.getFavorisCount(input)
    ).rejects.toThrow(/Droits insuffisants/);
    await expect(
      caller.indicateurs.indicateurs.getMesIndicateursCount(input)
    ).rejects.toThrow(/Droits insuffisants/);
    await expect(
      app
        .get(ListIndicateursService)
        .getPersonnalisesCount(input, restrictedUser)
    ).rejects.toThrow(/Droits insuffisants/);
  });
});
