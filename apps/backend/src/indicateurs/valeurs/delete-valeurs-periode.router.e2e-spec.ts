import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { DatabaseService } from '../../utils/database/database.service';
import { TrpcRouter } from '../../utils/trpc/trpc.router';
import { indicateurDefinitionTable } from '../indicateur/indicateur-definition.table';
import { indicateurValeurTable } from './indicateur-valeur.table';

describe("Suppression des valeurs d'une période", () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let collectiviteId: number;
  let caller: ReturnType<TrpcRouter['createCaller']>;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(async () => {
    databaseService = await getTestDatabase(app);
    router = await getTestRouter(app);
    const { collectivite, user, cleanup } = await addTestCollectiviteAndUser(
      databaseService,
      { user: { role: CollectiviteRole.ADMIN } }
    );
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.collectiviteId, collectivite.id));
      await cleanup();
    });
    collectiviteId = collectivite.id;
    caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const createIndicateurWithValeurs = async (dates: string[]) => {
    const indicateurId = await caller.indicateurs.indicateurs.create({
      collectiviteId,
      titre: `Indicateur ${dates.join(' ')}`,
    });
    for (const dateValeur of dates) {
      await caller.indicateurs.valeurs.upsert({
        collectiviteId,
        indicateurId,
        periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        dateValeur,
        resultat: 1,
        objectif: 2,
      });
    }
    return indicateurId;
  };

  const listDatesOf = async (indicateurIds: number[]) =>
    (
      await databaseService.db
        .select({
          indicateurId: indicateurValeurTable.indicateurId,
          dateValeur: indicateurValeurTable.dateValeur,
        })
        .from(indicateurValeurTable)
        .where(inArray(indicateurValeurTable.indicateurId, indicateurIds))
    )
      .map(({ indicateurId, dateValeur }) => `${indicateurId}:${dateValeur}`)
      .sort();

  test('supprime la période de tous les indicateurs demandés et garde les autres périodes', async () => {
    const firstIndicateurId = await createIndicateurWithValeurs([
      '2022-01-01',
      '2023-01-01',
    ]);
    const secondIndicateurId = await createIndicateurWithValeurs([
      '2022-01-01',
      '2023-01-01',
    ]);

    await caller.indicateurs.valeurs.deletePeriode({
      collectiviteId,
      indicateurIds: [firstIndicateurId, secondIndicateurId],
      dateValeur: '2022-01-01',
    });

    expect(await listDatesOf([firstIndicateurId, secondIndicateurId])).toEqual(
      [
        `${firstIndicateurId}:2023-01-01`,
        `${secondIndicateurId}:2023-01-01`,
      ].sort()
    );
  });

  test("ne supprime rien quand l'un des indicateurs n'appartient pas à la collectivité", async () => {
    const ownIndicateurId = await createIndicateurWithValeurs(['2022-01-01']);
    const other = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(
          eq(indicateurDefinitionTable.collectiviteId, other.collectivite.id)
        );
      await other.cleanup();
    });
    const otherCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(other.user),
    });
    const foreign = await otherCaller.indicateurs.indicateurs.create({
      collectiviteId: other.collectivite.id,
      titre: 'Indicateur étranger',
    });
    await otherCaller.indicateurs.valeurs.upsert({
      collectiviteId: other.collectivite.id,
      indicateurId: foreign,
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      dateValeur: '2022-01-01',
      resultat: 1,
    });

    await expect(
      caller.indicateurs.valeurs.deletePeriode({
        collectiviteId,
        indicateurIds: [ownIndicateurId, foreign],
        dateValeur: '2022-01-01',
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    expect(await listDatesOf([ownIndicateurId, foreign])).toEqual(
      [`${ownIndicateurId}:2022-01-01`, `${foreign}:2022-01-01`].sort()
    );
  });

  test('refuse la suppression à un membre en lecture seule et ne supprime rien', async () => {
    const indicateurId = await createIndicateurWithValeurs(['2022-01-01']);
    const reader = await addTestUser(databaseService, {
      collectiviteId,
      role: CollectiviteRole.LECTURE,
    });
    onTestFinished(reader.cleanup);

    await expect(
      router
        .createCaller({ user: getAuthUserFromUserCredentials(reader.user) })
        .indicateurs.valeurs.deletePeriode({
          collectiviteId,
          indicateurIds: [indicateurId],
          dateValeur: '2022-01-01',
        })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    expect(await listDatesOf([indicateurId])).toEqual([
      `${indicateurId}:2022-01-01`,
    ]);
  });
});
